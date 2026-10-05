import {randomUUID} from 'node:crypto';
import {ensureMerchantSchema} from './merchant';
export class ChatError extends Error {constructor(message:string,public status=400){super(message)}}
export function cursor(value:unknown){const s=String(value??'0');if(!/^\d{1,18}$/.test(s))throw new ChatError('消息位置无效');return s}
export async function conversationFor(userId:string,id:string){
 const db=await ensureMerchantSchema();
 const r=await db.query(`SELECT c.*,m.user_id AS seller_id,m.store_name_cn AS store,m.status AS store_status,u.display_name AS buyer_name FROM shop_conversations original JOIN shop_conversations c ON c.id=COALESCE(original.merged_into,original.id) JOIN merchants m ON m.id=c.merchant_id JOIN users u ON u.id=c.buyer_id WHERE original.id=$1 AND (c.buyer_id=$2 OR m.user_id=$2)`,[id,userId]);
 if(!r.rows[0])throw new ChatError('会话不存在或无权访问',404);return r.rows[0];
}
export async function openConversation(userId:string,b:Record<string,unknown>){
 const db=await ensureMerchantSchema();let row;
 if(typeof b.orderId==='string'){
  row=(await db.query(`SELECT o.id,m.id AS merchant_id,m.user_id AS seller_id,m.store_name_cn AS store,jsonb_build_object('kind','order','orderNo',o.order_no,'title',COALESCE(o.items->0->>'title','订单咨询'),'amount',o.total_amount) AS context FROM orders o JOIN merchants m ON m.id=o.merchant_id WHERE o.id=$1 AND o.user_id=$2`,[b.orderId,userId])).rows[0];
 }else if(typeof b.productId==='string'){
  row=(await db.query(`SELECT p.id,m.id AS merchant_id,m.user_id AS seller_id,m.store_name_cn AS store,jsonb_build_object('kind','product','title',p.title,'amount',p.price) AS context FROM products p JOIN merchants m ON m.id=p.merchant_id WHERE p.id=$1 AND p.status='active' AND m.status='active'`,[b.productId])).rows[0];
 }else throw new ChatError('请从商品或本人订单发起咨询');
 if(!row)throw new ChatError('商品或订单不可咨询',404);
 if(row.seller_id===userId)throw new ChatError('这是你自己的店铺，请在商家后台回复买家咨询');
 const r=await db.query(`INSERT INTO shop_conversations(id,buyer_id,merchant_id,context_key,context) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT(buyer_id,merchant_id) WHERE merged_into IS NULL DO UPDATE SET context=EXCLUDED.context RETURNING id`,[randomUUID(),userId,row.merchant_id,'store',JSON.stringify(row.context)]);return r.rows[0];
}
export async function listConversations(userId:string,mode:string,page:number){
 const db=await ensureMerchantSchema(),seller=mode==='merchant';
 const r=await db.query(`SELECT c.id,c.context,${seller?'u.display_name':'m.store_name_cn'} AS title,c.last_message AS preview,c.updated_at AS "updatedAt",(SELECT count(*)::int FROM shop_messages x WHERE x.conversation_id=c.id AND x.sender_id<>$1 AND x.seq>${seller?'c.seller_read_seq':'c.buyer_read_seq'}) AS unread FROM shop_conversations c JOIN merchants m ON m.id=c.merchant_id JOIN users u ON u.id=c.buyer_id WHERE c.merged_into IS NULL AND ${seller?'m.user_id':'c.buyer_id'}=$1 ORDER BY c.updated_at DESC,c.id DESC LIMIT 31 OFFSET $2`,[userId,(page-1)*30]);return {conversations:r.rows.slice(0,30),hasMore:r.rows.length>30};
}
export async function readMessages(userId:string,id:string,after='0',before='0'){
 const c=await conversationFor(userId,id),db=await ensureMerchantSchema();id=c.id;cursor(after);cursor(before);
 const r=await db.query(`SELECT seq::text,id,content,context,sender_id=$2 AS mine,created_at AS "createdAt" FROM shop_messages WHERE conversation_id=$1 AND ${before!=='0'?'seq<$3':after!=='0'?'seq>$3':'TRUE'} ORDER BY seq ${before!=='0'||after==='0'?'DESC':'ASC'} LIMIT 50`,before!=='0'||after!=='0'?[id,userId,before!=='0'?before:after]:[id,userId]);
 const messages=before!=='0'||after==='0'?r.rows.reverse():r.rows;
 return {messages,hasMore:messages.length===50,title:c.buyer_id===userId?c.store:c.buyer_name,context:c.context,canSend:c.store_status==='active',peerReadSeq:String(c.buyer_id===userId?c.seller_read_seq:c.buyer_read_seq)};
}
export async function sendMessage(userId:string,id:string,b:Record<string,unknown>){
 const content=typeof b.content==='string'?b.content.trim():'',nonce=typeof b.nonce==='string'?b.nonce:'';
 if(!content||content.length>2000||!/^[a-f0-9-]{36}$/i.test(nonce))throw new ChatError('消息需为1至2000字，请重试');
 id=(await conversationFor(userId,id)).id;
 const db=await ensureMerchantSchema(),client=await db.connect();
 try{
  await client.query('BEGIN');
  const c=(await client.query(`SELECT c.id,c.context,m.status FROM shop_conversations c JOIN merchants m ON m.id=c.merchant_id WHERE c.id=$1 AND (c.buyer_id=$2 OR m.user_id=$2) FOR UPDATE OF c`,[id,userId])).rows[0];
  if(!c)throw new ChatError('无权发送此会话消息',403);if(c.status!=='active')throw new ChatError('店铺已暂停营业，暂时无法发送消息',409);
  const prior=(await client.query('SELECT seq::text,id,content,context,TRUE AS mine,created_at AS "createdAt" FROM shop_messages WHERE conversation_id=$1 AND sender_id=$2 AND client_nonce=$3',[id,userId,nonce])).rows[0];
  if(prior){await client.query('COMMIT');return prior}
  const last=(await client.query("SELECT count(*)::int AS count FROM shop_messages WHERE sender_id=$1 AND created_at>NOW()-INTERVAL '1 minute'",[userId])).rows[0];if(last.count>=30)throw new ChatError('发送较频繁，请稍后再试',429);
  const r=await client.query(`INSERT INTO shop_messages(id,conversation_id,sender_id,client_nonce,content,context) VALUES($1,$2,$3,$4,$5,$6::jsonb) RETURNING seq::text,id,content,context,TRUE AS mine,created_at AS "createdAt"`,[randomUUID(),id,userId,nonce,content,JSON.stringify(c.context)]);
  await client.query('UPDATE shop_conversations SET last_message=$2,updated_at=NOW() WHERE id=$1',[id,content.slice(0,120)]);
  await client.query('COMMIT');return r.rows[0];
 }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
}
export async function markConversationRead(userId:string,id:string,seq:unknown){
 const c=await conversationFor(userId,id),value=cursor(seq),db=await ensureMerchantSchema(),field=c.buyer_id===userId?'buyer_read_seq':'seller_read_seq';id=c.id;
 await db.query(`UPDATE shop_conversations SET ${field}=GREATEST(${field},COALESCE((SELECT max(seq) FROM shop_messages WHERE conversation_id=$1 AND seq<=$2::bigint),0)) WHERE id=$1`,[id,value]);
}
