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
      clauses.push(`(p.title ILIKE $${values.length} OR m.store_name_cn ILIKE $${values.length})`);
    }
    if (["draft","active","archived"].includes(status)) {
      values.push(status);
      clauses.push(`p.status = $${values.length}`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const database = await ensureMerchantSchema();
    const result = await database.query(
      `SELECT p.id, p.title, p.description, p.category, p.price::text,
              p.stock, p.status, p.created_at AS "createdAt",
              p.updated_at AS "updatedAt", m.id AS "merchantId",
              m.store_name_cn AS "storeNameCn"
         FROM products p JOIN merchants m ON m.id=p.merchant_id
         ${where}
        ORDER BY p.created_at DESC LIMIT 500`,
      values,
    );
    return NextResponse.json({
      products: result.rows.map((item) => ({
        ...item,
        createdAt: new Date(item.createdAt).toISOString(),
        updatedAt: new Date(item.updatedAt).toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin product list failed", error);
    return NextResponse.json({ message: "全站商品加载失败" }, { status: 500 });
  }
}
