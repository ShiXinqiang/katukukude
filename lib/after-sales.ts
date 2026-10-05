import {randomUUID} from 'node:crypto';
import {ensureMerchantSchema} from './merchant';
import {restoreOrderStock} from './order-stock';
import type {AuthUser} from './data';
export async function requestAfterSale(user:AuthUser,body:any){
 const reason=String(body.reason||'').trim().slice(0,2000);if(reason.length<10)throw Error('请用至少10个字说明商品问题及希望如何处理');
 if(!['refund','return_refund'].includes(body.kind))throw Error('请选择仅退款或退货退款');
 const db=await ensureMerchantSchema(),c=await db.connect();
 try{await c.query('BEGIN');const o=(await c.query('SELECT * FROM orders WHERE id=$1 AND user_id=$2 FOR UPDATE',[body.orderId,user.id])).rows[0];
 if(!o||o.payment_status!=='paid')throw Error('只能为本人已付款订单申请售后');
 const exists=await c.query("SELECT id FROM after_sales WHERE order_id=$1 AND status IN ('requested','approved','refunded')",[o.id]);if(exists.rows.length)throw Error('该订单已有待处理或已退款的售后申请');
 const id=randomUUID();await c.query('INSERT INTO after_sales(id,order_id,user_id,merchant_id,kind,reason,amount) VALUES($1,$2,$3,$4,$5,$6,$7)',[id,o.id,user.id,o.merchant_id,body.kind,reason,o.paid_amount||o.total_amount]);
 await c.query('INSERT INTO commerce_audit(id,actor_id,target_id,action,details) VALUES($1,$2,$3,$4,$5::jsonb)',[randomUUID(),user.id,o.id,'aftersale.request',JSON.stringify({id,kind:body.kind})]);await c.query('COMMIT');return{id};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release()}
}
export async function updateAfterSale(user:AuthUser,id:string,body:any,merchantId?:string){
 const db=await ensureMerchantSchema(),c=await db.connect();
 try{await c.query('BEGIN');const link=(await c.query('SELECT order_id FROM after_sales WHERE id=$1',[id])).rows[0];if(!link)throw Error('售后申请不存在');
 const o=(await c.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE',[link.order_id])).rows[0];const a=(await c.query('SELECT * FROM after_sales WHERE id=$1 FOR UPDATE',[id])).rows[0];
 const note=String(body.note||'').trim().slice(0,2000);
 if(body.action==='reply'){
  if(a.merchant_id!==merchantId)throw Error('无权处理其他店铺的售后');if(!['requested','approved'].includes(a.status)||note.length<5)throw Error('请为进行中的售后填写至少5字处理意见');
  await c.query('UPDATE after_sales SET merchant_reply=$2,updated_at=NOW() WHERE id=$1',[id,note]);
 }else{
  if(user.role!=='admin')throw Error('需要平台管理员审核退款');
  if(body.action==='approve'||body.action==='reject'){
   if(a.status!=='requested'||note.length<5)throw Error('只能审核待处理申请，并需填写至少5字处理说明（退货地址等）');
   await c.query('UPDATE after_sales SET status=$2,review_note=$3,updated_at=NOW() WHERE id=$1',[id,body.action==='approve'?'approved':'rejected',note]);
  }else if(body.action==='refund'){
   const reference=String(body.reference||'').trim().slice(0,160);
   if(a.status!=='approved'||o.payment_status!=='paid'||!reference||body.confirmTransferred!==true)throw Error('仅能为已批准申请登记真实完成的退款，需交易凭证编号及确认');
   const amount=Number(body.amount),expected=Number(a.amount);
   if(!Number.isFinite(amount)||Math.abs(amount-expected)>0.001)throw Error(`此流程为整单退款，金额应为 Ks ${expected}`);
   if(a.kind==='return_refund'&&body.returnReceived!==true)throw Error('退货退款请先确认已收到退回商品');
   if(body.restock===true){if(o.shipment&&body.returnReceived!==true)throw Error('已发货商品需确认退回后才能恢复库存');await restoreOrderStock(c,o)}
   await c.query("UPDATE orders SET status='refunded',payment_status='refunded',updated_at=NOW() WHERE id=$1",[o.id]);
   await c.query("UPDATE after_sales SET status='refunded',refund_reference=$2,review_note=$3,updated_at=NOW() WHERE id=$1",[id,reference,note||a.review_note]);
  }else throw Error('售后操作无效');
 }
 await c.query('INSERT INTO commerce_audit(id,actor_id,target_id,action,details) VALUES($1,$2,$3,$4,$5::jsonb)',[randomUUID(),user.id,o.id,'aftersale.'+body.action,JSON.stringify({id,restock:body.restock===true,note})]);
 await c.query("INSERT INTO notifications(id,user_id,type,title,content) VALUES($1,$2,'order','售后进度更新',$3)",[randomUUID(),a.user_id,`订单 ${o.order_no} 的售后已更新，请到我的订单查看。`]);
 await c.query('COMMIT');return{success:true};
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release()}
}
