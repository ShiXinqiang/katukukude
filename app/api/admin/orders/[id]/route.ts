import { NextResponse } from "next/server";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../../lib/admin";

export const dynamic = "force-dynamic";

type OrderDetailRow = {
  id: string;
  orderNo: string;
  userId: string | null;
  username: string | null;
  displayName: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  paidAmount: string | null;
  transactionId: string | null;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  items: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const database = await ensureAdminSchema();
    const result = await database.query<OrderDetailRow>(
      `SELECT o.id,
              o.order_no AS "orderNo",
              o.user_id AS "userId",
              u.username,
              u.display_name AS "displayName",
              o.status,
              o.payment_status AS "paymentStatus",
              o.total_amount::text AS "totalAmount",
              o.paid_amount::text AS "paidAmount",
              o.transaction_id AS "transactionId",
              o.shipping_name AS "shippingName",
              o.shipping_phone AS "shippingPhone",
              o.shipping_address AS "shippingAddress",
              o.items,
              o.created_at AS "createdAt",
              o.updated_at AS "updatedAt"
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id = $1
       LIMIT 1`,
      [params.id],
    );

    const order = result.rows[0];
    if (!order) {
      return NextResponse.json({ message: "订单不存在" }, { status: 404 });
    }

    return NextResponse.json({
      order: {
        ...order,
        createdAt: new Date(order.createdAt).toISOString(),
        updatedAt: new Date(order.updatedAt).toISOString(),
      },
    });
  } catch (error) {
    console.error("Admin order detail failed", error);
    return NextResponse.json(
      { message: "订单详情加载失败" },
      { status: 500 },
    );
  }
}
