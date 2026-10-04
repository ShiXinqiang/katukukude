import { randomUUID } from "node:crypto";
import { ensureMerchantSchema } from "./merchant";
import { nextOrderStatus, orderLabels } from "./order-rules";

export async function changeOrder(id: string, owner: string, actor: "customer" | "merchant", action: string) {
  const db = await ensureMerchantSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`SELECT * FROM orders WHERE id=$1 AND ${actor === "customer" ? "user_id" : "merchant_id"}=$2 FOR UPDATE`, [id, owner]);
    const order = result.rows[0];
    if (!order) throw new Error("订单不存在或无权操作");
    const status = nextOrderStatus(order.status, order.payment_status, action, actor);
    if (status === "cancelled") {
      // The locked order ensures repeated cancellation cannot restore stock twice.
      const counts = new Map<string, number>();
      for (const item of Array.isArray(order.items) ? order.items : []) {
        if (typeof item.productId === "string" && Number.isInteger(item.quantity) && item.quantity > 0) {
          counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity);
        }
      }
      for (const [productId, quantity] of Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b))) {
        await client.query("UPDATE products SET stock=stock+$2,sales_count=GREATEST(0,sales_count-$2),updated_at=NOW() WHERE id=$1 AND merchant_id=$3", [productId, quantity, order.merchant_id]);
      }
    }
    await client.query("UPDATE orders SET status=$2,updated_at=NOW() WHERE id=$1", [id, status]);
    if (order.user_id) await client.query("INSERT INTO notifications(id,user_id,type,title,content) VALUES($1,$2,'order',$3,$4)", [randomUUID(), order.user_id, "订单状态更新", `订单 ${order.order_no}：${orderLabels[status]}`]);
    await client.query("COMMIT");
    return { success: true, status };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
