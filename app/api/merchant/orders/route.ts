import { NextResponse } from "next/server";
import { ensureMerchantSchema, isMerchantRequiredError, requireMerchant } from "../../../../lib/merchant";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { merchant } = await requireMerchant();
    const database = await ensureMerchantSchema();
    const result = await database.query(
      `SELECT o.id, o.order_no AS "orderNo", o.status, o.payment_status AS "paymentStatus",
              o.total_amount::text AS "totalAmount", o.paid_amount::text AS "paidAmount",
              o.shipping_name AS "shippingName", o.shipping_phone AS "shippingPhone",
              o.shipping_address AS "shippingAddress", o.items,
              o.created_at AS "createdAt", u.username, u.display_name AS "displayName"
         FROM orders o LEFT JOIN users u ON u.id = o.user_id
        WHERE o.merchant_id = $1 ORDER BY o.created_at DESC LIMIT 200`,
      [merchant.id],
    );
    return NextResponse.json({
      orders: result.rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt).toISOString(),
      })),
    });
  } catch (error) {
    if (isMerchantRequiredError(error)) return NextResponse.json({ message: "需要商家权限" }, { status: 403 });
    return NextResponse.json({ message: "商家订单加载失败" }, { status: 500 });
  }
}
