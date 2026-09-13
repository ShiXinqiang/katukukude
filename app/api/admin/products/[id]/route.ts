import { NextResponse } from "next/server";
import { getCurrentAdmin } from "../../../../../lib/admin";
import { cleanText, ensureMerchantSchema } from "../../../../../lib/merchant";

export const dynamic = "force-dynamic";
const strings = (value: unknown, max = 12) => Array.isArray(value) ? value.filter((item) => typeof item === "string").map((item) => cleanText(item, 100)).filter(Boolean).slice(0, max) : [];
const specs = (value: unknown) => Array.isArray(value) ? value.slice(0, 12).map((item) => {
  const row = item && typeof item === "object" ? item as Record<string, unknown> : {};
  return { name: cleanText(row.name, 40), values: strings(row.values, 24) };
}).filter((item) => item.name && item.values.length) : [];

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const db = await ensureMerchantSchema();
    const current = await db.query<any>("SELECT * FROM products WHERE id=$1", [params.id]);
    if (!current.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    const x = current.rows[0];
    const status = body.status === undefined ? x.status : String(body.status);
    if (!["draft", "pending", "active", "rejected", "archived"].includes(status)) return NextResponse.json({ message: "商品状态无效" }, { status: 400 });

    const title = body.title === undefined ? x.title : cleanText(body.title, 200);
    const subtitle = body.subtitle === undefined ? x.subtitle : cleanText(body.subtitle, 160) || null;
    const description = body.description === undefined ? x.description : cleanText(body.description, 5000);
    const category = body.category === undefined ? x.category : cleanText(body.category, 80);
    const price = body.price === undefined ? Number(x.price) : Number(body.price);
    const originalPrice = body.originalPrice === undefined ? (x.original_price === null ? null : Number(x.original_price)) : (body.originalPrice ? Number(body.originalPrice) : null);
    const stock = body.stock === undefined ? Number(x.stock) : Number(body.stock);
    const shippingFee = body.shippingFee === undefined ? Number(x.shipping_fee) : Number(body.shippingFee);
    const sortOrder = body.sortOrder === undefined ? Number(x.sort_order) : Number(body.sortOrder);
    const rejectionReason = cleanText(body.rejectionReason, 1000);

    if (title.length < 4 || description.length < 10 || !category || !Number.isFinite(price) || price <= 0 || originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price) || !Number.isInteger(stock) || stock < 0 || !Number.isFinite(shippingFee) || shippingFee < 0 || !Number.isInteger(sortOrder) || sortOrder < -9999 || sortOrder > 9999) {
      return NextResponse.json({ message: "请检查标题、详情、分类、价格、原价、库存、运费和排序" }, { status: 400 });
    }
    if (status === "active" && stock < 1) return NextResponse.json({ message: "库存必须大于 0 才能上架" }, { status: 400 });
    if (status === "rejected" && !rejectionReason) return NextResponse.json({ message: "拒绝商品必须填写原因" }, { status: 400 });

    await db.query(`UPDATE products SET
      title=$2,subtitle=$3,description=$4,category=$5,price=$6,original_price=$7,stock=$8,status=$9,
      images=$10::jsonb,tags=$11::jsonb,specifications=$12::jsonb,shipping_fee=$13,free_shipping=$14,
      service_guarantees=$15::jsonb,badge=$16,is_official=$17,is_featured=$18,is_recommended=$19,
      promotion_title=$20,promotion_start=$21,promotion_end=$22,sort_order=$23,rejection_reason=$24,updated_at=NOW()
      WHERE id=$1`, [
      params.id, title, subtitle, description, category, price, originalPrice, stock, status,
      JSON.stringify(body.images === undefined ? x.images : strings(body.images, 8)),
      JSON.stringify(body.tags === undefined ? x.tags : strings(body.tags, 12)),
      JSON.stringify(body.specifications === undefined ? x.specifications : specs(body.specifications)),
      shippingFee, body.freeShipping === undefined ? x.free_shipping : body.freeShipping === true,
      JSON.stringify(body.serviceGuarantees === undefined ? x.service_guarantees : strings(body.serviceGuarantees, 12)),
      body.badge === undefined ? x.badge : cleanText(body.badge, 32) || null,
      body.isOfficial === undefined ? x.is_official : body.isOfficial === true,
      body.isFeatured === undefined ? x.is_featured : body.isFeatured === true,
      body.isRecommended === undefined ? x.is_recommended : body.isRecommended === true,
      body.promotionTitle === undefined ? x.promotion_title : cleanText(body.promotionTitle, 80) || null,
      body.promotionStart === undefined ? x.promotion_start : body.promotionStart || null,
      body.promotionEnd === undefined ? x.promotion_end : body.promotionEnd || null,
      sortOrder, status === "rejected" ? rejectionReason : null,
    ]);
    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "商品配置更新失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!await getCurrentAdmin()) return NextResponse.json({ message: "需要超级管理员权限" }, { status: 401 });
    const db = await ensureMerchantSchema();
    const result = await db.query("DELETE FROM products WHERE id=$1 RETURNING id", [params.id]);
    if (!result.rows[0]) return NextResponse.json({ message: "商品不存在" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: "删除商品失败" }, { status: 500 });
  }
}
