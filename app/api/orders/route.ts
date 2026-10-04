import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { ensureMerchantSchema, cleanText } from "../../../lib/merchant";
import { requestedItems } from "../../../lib/order-rules";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录" }, { status: 401 });
    const db = await ensureMerchantSchema();
    const result = await db.query(`SELECT id,order_no AS "orderNo",status,payment_status AS "paymentStatus",total_amount::text AS "totalAmount",shipping_name AS "shippingName",shipping_phone AS "shippingPhone",shipping_address AS "shippingAddress",items,created_at AS "createdAt" FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, [user.id]);
    return NextResponse.json({ orders: result.rows });
  } catch { return NextResponse.json({ message: "订单加载失败，请稍后重试" }, { status: 503 }); }
}

export async function POST(request: Request) {
  let client;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "请先登录后提交订单" }, { status: 401 });
    const body = await request.json();
    const name = cleanText(body.shippingName, 80), phone = cleanText(body.shippingPhone, 32), address = cleanText(body.shippingAddress, 1000);
    if (!name || !phone || !address) return NextResponse.json({ message: "请填写完整收货信息" }, { status: 400 });
    const lines = requestedItems(body.items);
    const counts = new Map<string, number>();
    for (const line of lines) counts.set(line.productId, (counts.get(line.productId) || 0) + line.quantity);
    const db = await ensureMerchantSchema();
    client = await db.connect();
    await client.query("BEGIN");
    const result = await client.query(`SELECT p.*,m.store_name_cn FROM products p JOIN merchants m ON m.id=p.merchant_id WHERE p.id=ANY($1::text[]) AND m.status='active' ORDER BY p.id FOR UPDATE OF p`, [Array.from(counts.keys())]);
    if (result.rows.length !== counts.size) throw new Error("部分商品已下架，请返回购物车重新选择");
    const groups = new Map<string, any[]>();
    for (const product of result.rows) {
      if (product.status !== "active" || product.stock < counts.get(product.id)!) throw new Error(`${product.title}已下架或库存不足`);
      for (const line of lines.filter(x => x.productId === product.id)) {
        const specs = Array.isArray(product.specifications) ? product.specifications : [];
        if (specs.length && (line.spec === "默认规格" || !specs.every((s: { name: string; values: string[] }) => s.values.some(v => line.spec.split(" / ").includes(`${s.name}:${v}`) || line.spec.split("；").includes(`${s.name}：${v}`))))) {
          throw new Error(`${product.title}请选择完整有效的规格后再下单`);
        }
        const row = { productId: product.id, title: product.title, spec: line.spec, unitPrice: Number(product.price), quantity: line.quantity, subtotal: Number(product.price) * line.quantity, store: product.store_name_cn, shippingFee: product.free_shipping ? 0 : Number(product.shipping_fee) };
        groups.set(product.merchant_id, [...(groups.get(product.merchant_id) || []), row]);
      }
    }
    const orders = [];
    for (const [merchantId, rows] of Array.from(groups.entries())) {
      for (const row of rows) await client.query("UPDATE products SET stock=stock-$2,sales_count=sales_count+$2,updated_at=NOW() WHERE id=$1", [row.productId, row.quantity]);
      const shipping = Math.max(0, ...rows.map(x => x.shippingFee));
      const total = Math.round((rows.reduce((n, x) => n + x.subtotal, 0) + shipping) * 100) / 100;
      const id = randomUUID(), no = "KT" + Date.now() + randomUUID().slice(0, 6).toUpperCase();
      await client.query("INSERT INTO orders(id,order_no,user_id,merchant_id,status,payment_status,total_amount,shipping_name,shipping_phone,shipping_address,items) VALUES($1,$2,$3,$4,'pending','unpaid',$5,$6,$7,$8,$9::jsonb)", [id, no, user.id, merchantId, total, name, phone, address, JSON.stringify(rows)]);
      orders.push({ id, orderNo: no, total });
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true, orders, total: orders.reduce((n, x) => n + x.total, 0) }, { status: 201 });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return NextResponse.json({ message: error instanceof Error ? error.message : "订单提交失败" }, { status: 400 });
  } finally { client?.release(); }
}
