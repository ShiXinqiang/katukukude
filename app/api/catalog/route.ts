import { NextResponse } from "next/server";
import { ensureMerchantSchema } from "../../../lib/merchant";

export const dynamic = "force-dynamic";

function toProduct(row: Record<string, unknown>) {
  const price = Number(row.price) || 0;
  const images = Array.isArray(row.images) ? row.images.filter((x): x is string => typeof x === "string") : [];
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: String(row.description || "").slice(0, 60),
    description: String(row.description || ""),
    price,
    original: price,
    rating: "暂无",
    distance: String(row.city || row.township || "本地"),
    sales: "新品",
    tags: [String(row.category || "好物"), "商家直售"],
    store: String(row.storeNameCn || row.storeNameMm || "卡兔商家"),
    imageLabel: images[0] ? "商品图片" : "暂无商品图片",
    images,
    category: String(row.category || ""),
    stock: Number(row.stock) || 0,
  };
}

export async function GET(request: Request) {
  try {
    const database = await ensureMerchantSchema();
    const url = new URL(request.url);
    const keyword = (url.searchParams.get("q") || "").trim();
    const id = (url.searchParams.get("id") || "").trim();
    const values: unknown[] = [];
    const clauses = ["p.status = 'active'", "p.stock > 0", "m.status = 'active'"];
    if (id) { values.push(id); clauses.push(`p.id = $${values.length}`); }
    if (keyword) {
      values.push(`%${keyword}%`);
      clauses.push(`(p.title ILIKE $${values.length} OR p.description ILIKE $${values.length} OR p.category ILIKE $${values.length} OR m.store_name_cn ILIKE $${values.length} OR m.store_name_mm ILIKE $${values.length})`);
    }
    const result = await database.query(
      `SELECT p.id,p.title,p.description,p.category,p.price,p.stock,p.images,
              m.store_name_cn AS "storeNameCn",m.store_name_mm AS "storeNameMm",
              m.city,m.township
         FROM products p JOIN merchants m ON m.id=p.merchant_id
        WHERE ${clauses.join(" AND ")}
        ORDER BY p.updated_at DESC LIMIT 60`, values);
    const products = result.rows.map(toProduct);
    return NextResponse.json(id ? { product: products[0] || null } : { products });
  } catch (error) {
    console.error("catalog error", error);
    return NextResponse.json({ products: [], message: "商品加载失败，请稍后重试" }, { status: 500 });
  }
}
