import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../../lib/admin";
import { cleanText, ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });

  const body = (await request.json()) as { status?: unknown; reviewNote?: unknown };
  const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
  const reviewNote = cleanText(body.reviewNote, 1000);
  if (!status) return NextResponse.json({ message: "审核结果无效" }, { status: 400 });
  if (status === "rejected" && !reviewNote) {
    return NextResponse.json({ message: "拒绝申请时必须填写原因" }, { status: 400 });
  }

  const database = await ensureMerchantSchema();
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query<{
      id: string;
      user_id: string;
      status: string;
      store_name_cn: string | null;
      store_name_mm: string | null;
      phone: string;
      business_type: string;
      state_region: string;
      city: string;
      township: string;
      address: string;
      description: string;
      document_ids: string[];
    }>(
      "SELECT * FROM merchant_applications WHERE id = $1 FOR UPDATE",
      [params.id],
    );
    const application = result.rows[0];
    if (!application) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "申请不存在" }, { status: 404 });
    }
    if (application.status !== "pending") {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "该申请已经审核过" }, { status: 409 });
    }

    const proofs = await client.query<{ kind: string }>(
      "SELECT kind FROM merchant_application_documents WHERE user_id = $1 AND id = ANY($2::text[])",
      [application.user_id, application.document_ids],
    );
    const photoCount = proofs.rows.filter((item) => item.kind === "store_photo").length;
    const videoCount = proofs.rows.filter((item) => item.kind === "store_video").length;
    if (status === "approved" && (photoCount < 2 || videoCount < 1)) {
      await client.query("ROLLBACK");
      return NextResponse.json({ message: "证明资料不完整，不能通过审核" }, { status: 400 });
    }

    await client.query(
      `UPDATE merchant_applications
          SET status = $2, review_note = $3, reviewed_by = $4,
              reviewed_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [params.id, status, reviewNote || null, admin.id],
    );

    if (status === "approved") {
      const storeName = application.store_name_cn || application.store_name_mm;
      if (!storeName) throw new Error("STORE_NAME_REQUIRED");
      await client.query(
        `INSERT INTO merchants (
            id, user_id, application_id, store_name_cn, store_name_mm, phone,
            business_type, state_region, city, township, address, description
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (user_id) DO UPDATE SET
            application_id = EXCLUDED.application_id,
            store_name_cn = EXCLUDED.store_name_cn,
            store_name_mm = EXCLUDED.store_name_mm,
            phone = EXCLUDED.phone,
            business_type = EXCLUDED.business_type,
            state_region = EXCLUDED.state_region,
            city = EXCLUDED.city,
            township = EXCLUDED.township,
            address = EXCLUDED.address,
            description = EXCLUDED.description,
            status = 'active', approved_at = NOW(), updated_at = NOW()`,
        [
          randomUUID(), application.user_id, application.id, storeName,
          application.store_name_mm, application.phone,
          application.business_type, application.state_region,
          application.city, application.township, application.address,
          application.description,
        ],
      );
      await client.query(
        "UPDATE users SET role = CASE WHEN role = 'admin' THEN role ELSE 'merchant' END, status = 'active', updated_at = NOW() WHERE id = $1",
        [application.user_id],
      );
    }

    await client.query(
      `INSERT INTO notifications (id, user_id, type, title, content)
       VALUES ($1,$2,'system',$3,$4)`,
      [
        randomUUID(), application.user_id,
        status === "approved" ? "商家入驻审核通过" : "商家入驻申请需修改",
        status === "approved"
          ? "你的商家申请已通过，现在可以进入独立商家后台管理商品。"
          : `你的商家申请未通过：${reviewNote}`,
      ],
    );
    await client.query("COMMIT");
    return NextResponse.json({ success: true, status });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Merchant application review failed", error);
    return NextResponse.json({ message: "审核操作失败" }, { status: 500 });
  } finally {
    client.release();
  }
}
