import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ensureAdminSchema, getCurrentAdmin } from "../../../../../../lib/admin";

export const dynamic = "force-dynamic";

type PaymentOrderRow = {
  id: string;
  orderNo: string;
  userId: string | null;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  paidAmount: string | null;
  transactionId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ message: "需要管理员权限" }, { status: 401 });
    }

    const body = (await request.json()) as {
      amount?: unknown;
      transactionId?: unknown;
    };
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string"
          ? Number(body.amount)
          : Number.NaN;
    const transactionId =
      typeof body.transactionId === "string" && body.transactionId.trim()
        ? body.transactionId.trim().slice(0, 160)
        : null;

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ message: "请输入有效的付款金额" }, { status: 400 });
    }

    const database = await ensureAdminSchema();
    const client = await database.connect();

    try {
      await client.query("BEGIN");
      const result = await client.query<PaymentOrderRow>(
        `SELECT id,
                order_no AS "orderNo",
                user_id AS "userId",
                status,
                payment_status AS "paymentStatus",
                total_amount::text AS "totalAmount",
                paid_amount::text AS "paidAmount",
                transaction_id AS "transactionId",
                created_at AS "createdAt",
                updated_at AS "updatedAt"
         FROM orders
         WHERE id = $1
         FOR UPDATE`,
        [params.id],
      );
      const order = result.rows[0];

      if (!order) {
        await client.query("ROLLBACK");
        return NextResponse.json({ message: "订单不存在" }, { status: 404 });
      }

      const expectedCents = Math.round(Number(order.totalAmount) * 100);
      const actualCents = Math.round(amount * 100);
      if (!Number.isFinite(expectedCents) || expectedCents !== actualCents) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            message: `付款金额不匹配，应付 ¥${Number(order.totalAmount).toFixed(2)}`,
          },
          { status: 400 },
        );
      }

      const alreadyPaid = order.paymentStatus === "paid";
      const updated = await client.query<PaymentOrderRow>(
        `UPDATE orders
         SET payment_status = 'paid',
             paid_amount = $2,
             transaction_id = COALESCE($3, transaction_id),
             status = CASE WHEN status = 'pending' THEN 'paid' ELSE status END,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id,
                   order_no AS "orderNo",
                   user_id AS "userId",
                   status,
                   payment_status AS "paymentStatus",
                   total_amount::text AS "totalAmount",
                   paid_amount::text AS "paidAmount",
                   transaction_id AS "transactionId",
                   created_at AS "createdAt",
                   updated_at AS "updatedAt"`,
        [params.id, amount.toFixed(2), transactionId],
      );

      if (!alreadyPaid && order.userId) {
        await client.query(
          `INSERT INTO notifications (id, user_id, type, title, content)
           VALUES ($1, $2, 'order', '付款成功', $3)`,
          [
            randomUUID(),
            order.userId,
            `订单 ${order.orderNo} 已确认收款 ¥${amount.toFixed(2)}。`,
          ],
        );
      }

      await client.query("COMMIT");
      const saved = updated.rows[0];

      return NextResponse.json({
        order: {
          ...saved,
          createdAt: new Date(saved.createdAt).toISOString(),
          updatedAt: new Date(saved.updatedAt).toISOString(),
        },
        notificationSent: !alreadyPaid && Boolean(order.userId),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Admin payment confirmation failed", error);
    return NextResponse.json(
      { message: "付款确认失败" },
      { status: 500 },
    );
  }
}
