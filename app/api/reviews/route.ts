import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {getCurrentUser} from '../../../lib/auth';
import {ensureMerchantSchema} from '../../../lib/merchant';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 try{
  const url=new URL(request.url),mine=url.searchParams.get('mine')==='true',productId=url.searchParams.get('productId')||'',page=Number(url.searchParams.get('page')||1);
  if(!Number.isInteger(page)||page<1||page>10000||!mine&&!productId)return NextResponse.json({message:'评价查询参数无效'},{status:400});
  const user=mine?await getCurrentUser():null;
  if(mine&&!user)return NextResponse.json({message:'请先登录后查看我的评价'},{status:401});
  const db=await ensureMerchantSchema(),value=mine?user!.id:productId,where=mine?'user_id=$1':'product_id=$1';
  const result=await db.query(`SELECT id,product_id AS "productId",product_title AS title,spec,rating,content,created_at AS "createdAt" FROM product_reviews WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $2`,[value,(page-1)*20]);
  const summary=await db.query(`SELECT count(*)::int AS total,round(avg(rating),1)::text AS average FROM product_reviews WHERE ${where}`,[value]);
  const pending=mine?(await db.query(`SELECT o.id AS "orderId",o.order_no AS "orderNo",i->>'productId' AS "productId",min(i->>'title') AS title,string_agg(DISTINCT i->>'spec',' / ') AS spec FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) i WHERE o.user_id=$1 AND o.status='completed' AND o.payment_status='paid' AND i->>'productId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM product_reviews r WHERE r.order_id=o.id AND r.product_id=i->>'productId') GROUP BY o.id,i->>'productId' ORDER BY o.created_at DESC LIMIT 100`,[user!.id])).rows:[];
  return NextResponse.json({reviews:result.rows.slice(0,20),hasMore:result.rows.length>20,...summary.rows[0],pending});
 }catch(e){console.error('reviews GET failed',{code:(e as {code?:string}).code||'UNKNOWN'});return NextResponse.json({message:'评价加载失败，请重试'},{status:503})}
}
export async function POST(request:Request){
 try{
  const user=await getCurrentUser();if(!user)return NextResponse.json({message:'请先登录'},{status:401});
  const b=await request.json(),content=typeof b.content==='string'?b.content.trim():'',rating=b.rating;
  if(typeof b.orderId!=='string'||typeof b.productId!=='string'||!Number.isInteger(rating)||rating<1||rating>5||content.length<5||content.length>2000)return NextResponse.json({message:'请选择1至5星，并填写5至2000字评价'},{status:400});
  const db=await ensureMerchantSchema();
  const result=await db.query(`INSERT INTO product_reviews(id,order_id,user_id,product_id,product_title,spec,rating,content) SELECT $1,o.id,o.user_id,$2,i->>'title',i->>'spec',$3,$4 FROM orders o CROSS JOIN LATERAL jsonb_array_elements(o.items) i WHERE o.id=$5 AND o.user_id=$6 AND o.status='completed' AND o.payment_status='paid' AND i->>'productId'=$2 LIMIT 1 ON CONFLICT(order_id,product_id) DO NOTHING RETURNING id`,[randomUUID(),b.productId,rating,content,b.orderId,user.id]);
  if(!result.rows.length)return NextResponse.json({message:'仅能评价本人已完成且已付款的订单商品，每件商品每单评价一次'},{status:409});
  return NextResponse.json({success:true},{status:201});
 }catch{return NextResponse.json({message:'评价提交失败，请重试'},{status:503})}
}
