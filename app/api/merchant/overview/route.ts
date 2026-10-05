import { NextResponse } from "next/server";
import { isMerchantRequiredError, requireMerchant } from "../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { merchant } = await requireMerchant();
    const { ensureMerchantSchema } = await import("../../../../lib/merchant");
    const database = await ensureMerchantSchema();
    const [products, activeProducts, orders, pendingOrders, revenue, todo] = await Promise.all([
      database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products WHERE merchant_id = $1", [merchant.id]),
      database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM products WHERE merchant_id = $1 AND status = 'active'", [merchant.id]),
      database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders WHERE merchant_id = $1", [merchant.id]),
      database.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders WHERE merchant_id = $1 AND status IN ('paid','processing')", [merchant.id]),
      database.query<{ total: string }>("SELECT COALESCE(SUM(paid_amount),0)::text AS total FROM orders WHERE merchant_id = $1 AND payment_status = 'paid'", [merchant.id]),
      database.query("SELECT (SELECT count(*)::int FROM products WHERE merchant_id=$1 AND status='pending') AS pending, (SELECT count(*)::int FROM products WHERE merchant_id=$1 AND status='active' AND stock<5) AS low, (SELECT count(*)::int FROM after_sales WHERE merchant_id=$1 AND status IN ('requested','approved')) AS cases",[merchant.id]),
    ]);
    return NextResponse.json({
      merchant,
      overview: {
        pendingProducts:todo.rows[0]?.pending||0,lowStock:todo.rows[0]?.low||0,afterSales:todo.rows[0]?.cases||0,
        products: Number(products.rows[0]?.count ?? 0),
        activeProducts: Number(activeProducts.rows[0]?.count ?? 0),
        orders: Number(orders.rows[0]?.count ?? 0),
        pendingOrders: Number(pendingOrders.rows[0]?.count ?? 0),
        revenue: Number(revenue.rows[0]?.total ?? 0),
      },
    });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    console.error("Merchant overview failed", error);
    return NextResponse.json({ message: "商家数据加载失败" }, { status: 500 });
  }
}
