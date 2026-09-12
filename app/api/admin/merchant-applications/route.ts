import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../lib/merchant";
import type { MerchantApplicationRecord } from "../../../../lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const status = new URL(request.url).searchParams.get("status") || "pending";
    if (!["pending", "approved", "rejected", "all"].includes(status)) {
      return NextResponse.json({ message: "无效的审核状态" }, { status: 400 });
    }

    const database = await ensureMerchantSchema();
    const values: unknown[] = [];
    const where = status === "all" ? "" : (values.push(status), "WHERE a.status = $1");
    const result = await database.query<MerchantApplicationRecord>(
      `SELECT a.id, a.user_id AS "userId", u.username,
              u.display_name AS "displayName",
              a.store_name_cn AS "storeNameCn", a.store_name_mm AS "storeNameMm",
              a.phone, a.email, a.tg_account AS "tgAccount",
              a.wechat_account AS "wechatAccount",
              a.business_type AS "businessType",
              a.state_region AS "stateRegion", a.city, a.township, a.address,
              a.map_link AS "mapLink", a.location_lat::text AS "locationLat",
              a.location_lng::text AS "locationLng", a.description,
              a.document_ids AS "documentIds",
              jsonb_array_length(a.document_ids) AS "documentCount",
              a.status, a.review_note AS "reviewNote",
              a.submitted_at AS "submittedAt", a.updated_at AS "updatedAt",
              a.reviewed_at AS "reviewedAt"
         FROM merchant_applications a
         JOIN users u ON u.id = a.user_id
         ${where}
        ORDER BY CASE WHEN a.status = 'pending' THEN 0 ELSE 1 END,
                 a.submitted_at DESC
        LIMIT 200`,
      values,
    );

    return NextResponse.json({
      applications: result.rows.map((item) => ({
        ...item,
        documentIds: Array.isArray(item.documentIds) ? item.documentIds : [],
        submittedAt: new Date(item.submittedAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString(),
        reviewedAt: item.reviewedAt ? new Date(item.reviewedAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("Admin merchant applications failed", error);
    return NextResponse.json({ message: "商家申请加载失败" }, { status: 500 });
  }
}
