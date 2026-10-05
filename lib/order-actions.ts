import {restoreOrderStock,validateShipment} from "./order-stock";
import { randomUUID } from "node:crypto";
import { ensureMerchantSchema } from "./merchant";
import { nextOrderStatus, orderLabels } from "./order-rules";

export async function changeOrder(id: string, owner: string, actor: "customer" | "merchant", action: string, shipment?:unknown) {
  const db = await ensureMerchantSchema();
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`SELECT * FROM orders WHERE id=$1 AND ${actor === "customer" ? "user_id" : "merchant_id"}=$2 FOR UPDATE`, [id, owner]);
    const order = result.rows[0];
    if (!order) throw new Error("订单不存在或无权操作");
    const status = nextOrderStatus(order.status, order.payment_status, action, actor);
    if(status==='cancelled')await restoreOrderStock(client,order);
    {
      const active=await client.query("SELECT 1 FROM after_sales WHERE order_id=$1 AND status IN ('requested','approved')",[id]);
      if(active.rows.length)throw Error("此订单有待处理售后，请先完成售后处理");
    }
    if(action==='ship'){
      await client.query("UPDATE orders SET shipment=$2::jsonb WHERE id=$1",[id,JSON.stringify(validateShipment(shipment))]);
    }
    if(status==='completed')await client.query("UPDATE orders SET completed_at=NOW() WHERE id=$1",[id]);
    await client.query("UPDATE orders SET status=$2,updated_at=NOW() WHERE id=$1", [id, status]);
    if (order.user_id) await client.query("INSERT INTO notifications(id,user_id,type,title,content) VALUES($1,$2,'order',$3,$4)", [randomUUID(), order.user_id, "订单状态更新", `订单 ${order.order_no}：${orderLabels[status]}`]);
    await client.query("INSERT INTO commerce_audit(id,actor_id,target_id,action,details) VALUES($1,$2,$3,$4,$5::jsonb)",[randomUUID(),actor==='customer'?owner:null,id,'order.'+action,JSON.stringify({actor,owner,from:order.status,to:status})]);
    await client.query("COMMIT");
    return { success: true, status };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
