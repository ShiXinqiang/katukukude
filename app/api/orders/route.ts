import {priceCheckout} from "../../../lib/checkout-pricing";
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
    const result = await db.query(`SELECT id,order_no AS "orderNo",status,payment_status AS "paymentStatus",total_amount::text AS "totalAmount",shipping_name AS "shippingName",shipping_phone AS "shippingPhone",shipping_address AS "shippingAddress",items,shipment,created_at AS "createdAt" FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`, [user.id]);
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
    const checkoutKey=typeof body.checkoutKey==='string'&&/^[a-f0-9-]{36}$/.test(body.checkoutKey)?body.checkoutKey:null;
    if(!checkoutKey)throw Error("结算会话失效，请重新进入结算页");
    const lines = requestedItems(body.items);
    const counts = new Map<string, number>();
    for (const line of lines) counts.set(line.productId, (counts.get(line.productId) || 0) + line.quantity);
    const db = await ensureMerchantSchema();
    client = await db.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[user.id+":"+checkoutKey]);
    const prior=await client.query('SELECT id,order_no AS "orderNo",total_amount::float AS total FROM orders WHERE user_id=$1 AND checkout_key=$2',[user.id,checkoutKey]);
    if(prior.rows.length){await client.query("COMMIT");return NextResponse.json({success:true,orders:prior.rows,total:prior.rows.reduce((n:number,o:any)=>n+Number(o.total),0)});}

    const result = await client.query(`SELECT p.*,m.store_name_cn FROM products p JOIN merchants m ON m.id=p.merchant_id WHERE p.id=ANY($1::text[]) AND m.status='active' ORDER BY p.id FOR UPDATE OF p`, [Array.from(counts.keys())]);
    if (result.rows.length !== counts.size) throw new Error("部分商品已下架，请返回购物车重新选择");
    const priced=priceCheckout(result.rows,lines,body.shippingRegion);
    if(typeof body.quoteToken!=="string"||body.quoteToken!==priced.quoteToken)throw Error("价格、配送或商品条款已变化，请重新核对后提交");
    const groups=priced.groups;
    for(const product of result.rows){
      const rules=product.product_rules;
      if(rules?.variants?.length){
        rules.variants=rules.variants.map((v:any)=>({...v,stock:v.stock-lines.filter(l=>l.productId===product.id&&l.spec===v.spec).reduce((n,l)=>n+l.quantity,0)}));
        await client.query("UPDATE products SET product_rules=$2::jsonb WHERE id=$1",[product.id,JSON.stringify(rules)]);
      }
    }
    const orders = [];
    for (const [merchantId, rows] of Array.from(groups.entries())) {
      for (const row of rows) await client.query("UPDATE products SET stock=stock-$2,sales_count=sales_count+$2,updated_at=NOW() WHERE id=$1", [row.productId, row.quantity]);
      const shipping = Math.max(0, ...rows.map(x => x.shippingFee));
      const total = Math.round((rows.reduce((n, x) => n + x.subtotal, 0) + shipping) * 100) / 100;
      const id = randomUUID(), no = "KT" + Date.now() + randomUUID().slice(0, 6).toUpperCase();
      await client.query("INSERT INTO orders(id,order_no,user_id,merchant_id,status,payment_status,total_amount,shipping_name,shipping_phone,shipping_address,items,checkout_key) VALUES($1,$2,$3,$4,'pending','unpaid',$5,$6,$7,$8,$9::jsonb,$10)", [id, no, user.id, merchantId, total, name, phone, address, JSON.stringify(rows),checkoutKey]);
      orders.push({ id, orderNo: no, total });
    }
    await client.query("COMMIT");
    return NextResponse.json({ success: true, orders, total: orders.reduce((n, x) => n + x.total, 0) }, { status: 201 });
  } catch (error) {
    if (client) await client.query("ROLLBACK");
    return NextResponse.json({ message: error instanceof Error ? error.message : "订单提交失败" }, { status: 400 });
  } finally { client?.release(); }
}
