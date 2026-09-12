import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import {
  cleanOptionalText,
  cleanText,
  createCommerceId,
  ensureMerchantSchema,
} from "../../../../lib/merchant";
import type { MerchantApplicationRecord } from "../../../../lib/data";

export const dynamic = "force-dynamic";

function serialize(row: MerchantApplicationRecord) {
  return {
    ...row,
    documentIds: Array.isArray(row.documentIds) ? row.documentIds : [],
    submittedAt: new Date(row.submittedAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    reviewedAt: row.reviewedAt ? new Date(row.reviewedAt).toISOString() : null,
  };
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const result = await database.query<MerchantApplicationRecord>(
      `SELECT id, user_id AS "userId", store_name_cn AS "storeNameCn",
              store_name_mm AS "storeNameMm", legal_name AS "legalName",
              contact_name AS "contactName", phone, email,
              business_type AS "businessType", license_no AS "licenseNo",
              identity_no AS "identityNo", state_region AS "stateRegion",
              city, township, address, map_link AS "mapLink", description,
              document_ids AS "documentIds", status, review_note AS "reviewNote",
              submitted_at AS "submittedAt", updated_at AS "updatedAt",
              reviewed_at AS "reviewedAt"
         FROM merchant_applications WHERE user_id = $1 LIMIT 1`,
      [user.id],
    );
    return NextResponse.json({ application: result.rows[0] ? serialize(result.rows[0]) : null });
  } catch (error) {
    console.error("Merchant application load failed", error);
    return NextResponse.json({ message: "申请资料加载失败" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录后申请" }, { status: 401 });
    if (user.status === "suspended") return NextResponse.json({ message: "账号已停用" }, { status: 403 });
    if (user.role === "merchant") return NextResponse.json({ message: "你已是认证商家" }, { status: 409 });

    const body = (await request.json()) as Record<string, unknown>;
    const required = {
      storeNameCn: cleanText(body.storeNameCn, 120),
      legalName: cleanText(body.legalName, 120),
      contactName: cleanText(body.contactName, 120),
      phone: cleanText(body.phone, 32),
      businessType: cleanText(body.businessType, 64),
      identityNo: cleanText(body.identityNo, 100),
      stateRegion: cleanText(body.stateRegion, 100),
      city: cleanText(body.city, 100),
      township: cleanText(body.township, 100),
      address: cleanText(body.address, 1000),
      description: cleanText(body.description, 2000),
    };
    if (Object.values(required).some((value) => !value)) {
      return NextResponse.json({ message: "请完整填写所有必填资料" }, { status: 400 });
    }
    if (!/^\+?95[0-9\s-]{7,18}$/.test(required.phone)) {
      return NextResponse.json({ message: "请输入有效的缅甸手机号（+95）" }, { status: 400 });
    }

    const documentIds = Array.isArray(body.documentIds)
      ? body.documentIds.filter((id): id is string => typeof id === "string").slice(0, 8)
      : [];
    if (documentIds.length < 2) {
      return NextResponse.json({ message: "请至少上传身份证明和店铺/营业证明" }, { status: 400 });
    }

    const database = await ensureMerchantSchema();
    const existing = await database.query<{ id: string; status: string }>(
      "SELECT id, status FROM merchant_applications WHERE user_id = $1 LIMIT 1", [user.id],
    );
    if (existing.rows[0]?.status === "approved") {
      return NextResponse.json({ message: "该申请已经通过审核" }, { status: 409 });
    }

    const ownedDocuments = await database.query<{ id: string }>(
      "SELECT id FROM merchant_application_documents WHERE user_id = $1 AND id = ANY($2::text[])",
      [user.id, documentIds],
    );
    if (ownedDocuments.rows.length !== documentIds.length) {
      return NextResponse.json({ message: "上传的证明文件无效，请重新上传" }, { status: 400 });
    }

    const id = existing.rows[0]?.id || createCommerceId();
    const values = [
      id, user.id, required.storeNameCn, cleanOptionalText(body.storeNameMm, 160),
      required.legalName, required.contactName, required.phone,
      cleanOptionalText(body.email, 160), required.businessType,
      cleanOptionalText(body.licenseNo, 100), required.identityNo,
      required.stateRegion, required.city, required.township, required.address,
      cleanOptionalText(body.mapLink, 1000), required.description,
      JSON.stringify(documentIds),
    ];
    const result = await database.query<MerchantApplicationRecord>(
      `INSERT INTO merchant_applications (
          id, user_id, store_name_cn, store_name_mm, legal_name, contact_name,
          phone, email, business_type, license_no, identity_no, state_region,
          city, township, address, map_link, description, document_ids
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb
        )
        ON CONFLICT (user_id) DO UPDATE SET
          store_name_cn = EXCLUDED.store_name_cn,
          store_name_mm = EXCLUDED.store_name_mm,
          legal_name = EXCLUDED.legal_name,
          contact_name = EXCLUDED.contact_name,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          business_type = EXCLUDED.business_type,
          license_no = EXCLUDED.license_no,
          identity_no = EXCLUDED.identity_no,
          state_region = EXCLUDED.state_region,
          city = EXCLUDED.city,
          township = EXCLUDED.township,
          address = EXCLUDED.address,
          map_link = EXCLUDED.map_link,
          description = EXCLUDED.description,
          document_ids = EXCLUDED.document_ids,
          status = 'pending', review_note = NULL, reviewed_by = NULL,
          reviewed_at = NULL, submitted_at = NOW(), updated_at = NOW()
        RETURNING id, user_id AS "userId", store_name_cn AS "storeNameCn",
          store_name_mm AS "storeNameMm", legal_name AS "legalName",
          contact_name AS "contactName", phone, email,
          business_type AS "businessType", license_no AS "licenseNo",
          identity_no AS "identityNo", state_region AS "stateRegion",
          city, township, address, map_link AS "mapLink", description,
          document_ids AS "documentIds", status, review_note AS "reviewNote",
          submitted_at AS "submittedAt", updated_at AS "updatedAt",
          reviewed_at AS "reviewedAt"`,
      values,
    );
    await database.query(
      "UPDATE merchant_application_documents SET application_id = $1 WHERE user_id = $2 AND id = ANY($3::text[])",
      [id, user.id, documentIds],
    );
    return NextResponse.json({ application: serialize(result.rows[0]) }, { status: existing.rows[0] ? 200 : 201 });
  } catch (error) {
    console.error("Merchant application submit failed", error);
    return NextResponse.json({ message: "申请提交失败，请稍后重试" }, { status: 500 });
  }
}
