import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";
import {
  cleanOptionalText,
  cleanText,
  createCommerceId,
  ensureMerchantSchema,
} from "../../../../lib/merchant";
import type {
  MerchantApplicationRecord,
  MerchantDocumentRecord,
} from "../../../../lib/data";

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

function isValidPhone(value: string) {
  const phone = value.replace(/[\s()-]/g, "");
  return /^(?:\+?95|0)9\d{7,10}$/.test(phone)
    || /^(?:\+?86)?1[3-9]\d{9}$/.test(phone);
}

function isValidEmail(value: string | null) {
  return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const database = await ensureMerchantSchema();
    const result = await database.query<MerchantApplicationRecord>(
      `SELECT id, user_id AS "userId", store_name_cn AS "storeNameCn",
              store_name_mm AS "storeNameMm", phone, email,
              tg_account AS "tgAccount", wechat_account AS "wechatAccount",
              business_type AS "businessType", state_region AS "stateRegion",
              city, township, address, map_link AS "mapLink",
              location_lat::text AS "locationLat", location_lng::text AS "locationLng",
              description, document_ids AS "documentIds", status,
              review_note AS "reviewNote", submitted_at AS "submittedAt",
              updated_at AS "updatedAt", reviewed_at AS "reviewedAt"
         FROM merchant_applications WHERE user_id = $1 LIMIT 1`,
      [user.id],
    );
    const application = result.rows[0] ? serialize(result.rows[0]) : null;
    let documents: MerchantDocumentRecord[] = [];
    if (application?.documentIds.length) {
      const documentResult = await database.query<MerchantDocumentRecord>(
        `SELECT id, kind, file_name AS "fileName", file_size AS "fileSize",
                mime_type AS "mimeType"
           FROM merchant_application_documents
          WHERE user_id = $1 AND id = ANY($2::text[])
          ORDER BY created_at ASC`,
        [user.id, application.documentIds],
      );
      documents = documentResult.rows;
    }
    return NextResponse.json({ application, documents });
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
    const storeNameCn = cleanOptionalText(body.storeNameCn, 120);
    const storeNameMm = cleanOptionalText(body.storeNameMm, 160);
    const phone = cleanText(body.phone, 32);
    const email = cleanOptionalText(body.email, 160);
    const businessType = cleanText(body.businessType, 64);
    const stateRegion = cleanText(body.stateRegion, 100);
    const city = cleanText(body.city, 100);
    const township = cleanText(body.township, 100);
    const address = cleanText(body.address, 1000);
    const description = cleanText(body.description, 1000);
    const tgAccount = cleanOptionalText(body.tgAccount, 100);
    const wechatAccount = cleanOptionalText(body.wechatAccount, 100);
    const mapLink = cleanOptionalText(body.mapLink, 1000);
    const locationLat = Number(body.locationLat);
    const locationLng = Number(body.locationLng);

    if (!storeNameCn && !storeNameMm) {
      return NextResponse.json({ message: "中文店名和缅文店名至少填写一个" }, { status: 400 });
    }
    if (!businessType || !stateRegion || !city || !township || !address) {
      return NextResponse.json({ message: "请完整填写经营类型和营业地址" }, { status: 400 });
    }
    if (description.length < 10 || description.length > 50) {
      return NextResponse.json({ message: "店铺介绍需为 10–50 个字" }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ message: "请输入有效的中国或缅甸手机号" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "邮箱格式不正确" }, { status: 400 });
    }
    if (mapLink && !/^https?:\/\//i.test(mapLink)) {
      return NextResponse.json({ message: "地图地址必须是完整网页链接" }, { status: 400 });
    }

    const documentIds = Array.isArray(body.documentIds)
      ? [...new Set(body.documentIds.filter((id): id is string => typeof id === "string"))].slice(0, 8)
      : [];
    const database = await ensureMerchantSchema();
    const documents = documentIds.length
      ? await database.query<{ id: string; kind: string }>(
          "SELECT id, kind FROM merchant_application_documents WHERE user_id = $1 AND id = ANY($2::text[])",
          [user.id, documentIds],
        )
      : { rows: [] as Array<{ id: string; kind: string }> };
    const photoCount = documents.rows.filter((item) => item.kind === "store_photo").length;
    const videoCount = documents.rows.filter((item) => item.kind === "store_video").length;
    if (documents.rows.length !== documentIds.length || photoCount < 2 || videoCount < 1) {
      return NextResponse.json({ message: "请上传两张不同的店铺照片和一段现场视频" }, { status: 400 });
    }

    const existing = await database.query<{ id: string; status: string }>(
      "SELECT id, status FROM merchant_applications WHERE user_id = $1 LIMIT 1",
      [user.id],
    );
    if (existing.rows[0]?.status === "approved") {
      return NextResponse.json({ message: "该申请已经通过审核" }, { status: 409 });
    }

    const id = existing.rows[0]?.id || createCommerceId();
    const values = [
      id, user.id, storeNameCn, storeNameMm, phone, email, tgAccount, wechatAccount,
      businessType, stateRegion, city, township, address, mapLink,
      Number.isFinite(locationLat) && locationLat >= -90 && locationLat <= 90 ? locationLat : null,
      Number.isFinite(locationLng) && locationLng >= -180 && locationLng <= 180 ? locationLng : null,
      description, JSON.stringify(documentIds),
    ];
    const result = await database.query<MerchantApplicationRecord>(
      `INSERT INTO merchant_applications (
          id, user_id, store_name_cn, store_name_mm, phone, email,
          tg_account, wechat_account, business_type, state_region, city,
          township, address, map_link, location_lat, location_lng,
          description, document_ids
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18::jsonb
        )
        ON CONFLICT (user_id) DO UPDATE SET
          store_name_cn = EXCLUDED.store_name_cn,
          store_name_mm = EXCLUDED.store_name_mm,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          tg_account = EXCLUDED.tg_account,
          wechat_account = EXCLUDED.wechat_account,
          business_type = EXCLUDED.business_type,
          state_region = EXCLUDED.state_region,
          city = EXCLUDED.city,
          township = EXCLUDED.township,
          address = EXCLUDED.address,
          map_link = EXCLUDED.map_link,
          location_lat = EXCLUDED.location_lat,
          location_lng = EXCLUDED.location_lng,
          description = EXCLUDED.description,
          document_ids = EXCLUDED.document_ids,
          status = 'pending', review_note = NULL, reviewed_by = NULL,
          reviewed_at = NULL, submitted_at = NOW(), updated_at = NOW()
        RETURNING id, user_id AS "userId", store_name_cn AS "storeNameCn",
          store_name_mm AS "storeNameMm", phone, email,
          tg_account AS "tgAccount", wechat_account AS "wechatAccount",
          business_type AS "businessType", state_region AS "stateRegion",
          city, township, address, map_link AS "mapLink",
          location_lat::text AS "locationLat", location_lng::text AS "locationLng",
          description, document_ids AS "documentIds", status,
          review_note AS "reviewNote", submitted_at AS "submittedAt",
          updated_at AS "updatedAt", reviewed_at AS "reviewedAt"`,
      values,
    );
    await database.query(
      "UPDATE merchant_application_documents SET application_id = $1 WHERE user_id = $2 AND id = ANY($3::text[])",
      [id, user.id, documentIds],
    );
    return NextResponse.json(
      { application: serialize(result.rows[0]) },
      { status: existing.rows[0] ? 200 : 201 },
    );
  } catch (error) {
    console.error("Merchant application submit failed", error);
    return NextResponse.json({ message: "申请提交失败，请稍后重试" }, { status: 500 });
  }
}
