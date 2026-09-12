import { NextResponse } from "next/server";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../lib/admin";

export const dynamic = "force-dynamic";

type OrderListRow = {
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
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number(searchParams.get("pageSize") || 20) || 20),
    );
    const search = searchParams.get("search")?.trim() ?? "";
    const where = search
      ? `WHERE o.order_no ILIKE $1
          OR u.username ILIKE $1
          OR u.display_name ILIKE $1
          OR COALESCE(o.transaction_id, '') ILIKE $1
          OR o.total_amount::text ILIKE $1`
      : "";
    const offset = (page - 1) * pageSize;
    const listParams = search
      ? [`%${search}%`, pageSize, offset]
      : [pageSize, offset];
    const limitIndex = search ? 2 : 1;
    const offsetIndex = search ? 3 : 2;

    const database = await ensureAdminSchema();
    const [countResult, orderResult] = await Promise.all([
      database.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         ${where}`,
        search ? [`%${search}%`] : [],
      ),
      database.query<OrderListRow>(
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
                o.created_at AS "createdAt",
                o.updated_at AS "updatedAt"
         FROM orders o
         LEFT JOIN users u ON u.id = o.user_id
         ${where}
         ORDER BY o.created_at DESC
         LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
        listParams,
      ),
    ]);

    const total = Number(countResult.rows[0]?.count ?? 0);
    return NextResponse.json({
      orders: orderResult.rows.map((order) => ({
        ...order,
        createdAt: new Date(order.createdAt).toISOString(),
        updatedAt: new Date(order.updatedAt).toISOString(),
      })),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("Admin order list failed", error);
    return NextResponse.json(
      { message: "订单数据加载失败" },
      { status: 500 },
    );
  }
}
