import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../lib/admin";
import { ensureMerchantSchema } from "../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const params = new URL(request.url).searchParams;
    const search = params.get("search")?.trim() || "";
    const status = params.get("status") || "all";
    const values: unknown[] = [];
    const clauses: string[] = [];
    if (search) {
      values.push(`%${search}%`);
      clauses.push(`(m.store_name_cn ILIKE $${values.length} OR coalesce(m.store_name_mm,'') ILIKE $${values.length} OR u.username ILIKE $${values.length})`);
    }
    if (["active","suspended","closed"].includes(status)) {
      values.push(status);
      clauses.push(`m.status = $${values.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const database = await ensureMerchantSchema();
    const result = await database.query(
      `SELECT m.id, m.user_id AS "userId", m.store_name_cn AS "storeNameCn",
              m.store_name_mm AS "storeNameMm", m.phone,
              m.business_type AS "businessType", m.state_region AS "stateRegion",
              m.city, m.township, m.address, m.description, m.status,
              m.approved_at AS "approvedAt", u.username,
              u.display_name AS "displayName",
              COUNT(DISTINCT p.id)::int AS "productCount",
              COUNT(DISTINCT o.id)::int AS "orderCount"
         FROM merchants m
         JOIN users u ON u.id = m.user_id
         LEFT JOIN products p ON p.merchant_id = m.id
         LEFT JOIN orders o ON o.merchant_id = m.id
         ${where}
        GROUP BY m.id, u.id
        ORDER BY m.approved_at DESC
        LIMIT 300`,
      values,
    );
    return NextResponse.json({
      merchants: result.rows.map((item) => ({
        ...item,
        approvedAt: new Date(item.approvedAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin merchant list failed", error);
    return NextResponse.json({ message: "商家列表加载失败" }, { status: 500 });
  }
}
