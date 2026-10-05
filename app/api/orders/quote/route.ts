import {NextResponse} from "next/server";
import {ensureMerchantSchema} from "../../../../lib/merchant";
import {requestedItems} from "../../../../lib/order-rules";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  const lines=requestedItems((await request.json()).items),counts=new Map<string,number>();
  for(const line of lines)counts.set(line.productId,(counts.get(line.productId)||0)+line.quantity);
  const db=await ensureMerchantSchema();
  const result=await db.query("SELECT p.id,p.price,p.stock,p.merchant_id,p.shipping_fee,p.free_shipping FROM products p JOIN merchants m ON m.id=p.merchant_id WHERE p.id=ANY($1::text[]) AND p.status='active' AND m.status='active'",[Array.from(counts.keys())]);
  if(result.rows.length!==counts.size)throw Error("部分商品已下架，请返回购物车重新选择");
  let subtotal=0;const fees=new Map<string,number>();
  for(const p of result.rows){const quantity=counts.get(p.id)!;if(p.stock<quantity)throw Error("商品库存不足，请减少数量");subtotal+=Number(p.price)*quantity;fees.set(p.merchant_id,Math.max(fees.get(p.merchant_id)||0,p.free_shipping?0:Number(p.shipping_fee)));}
  const shipping=Array.from(fees.values()).reduce((a,b)=>a+b,0);subtotal=Math.round(subtotal*100)/100;
  return NextResponse.json({subtotal,shipping,total:Math.round((subtotal+shipping)*100)/100});
 }catch(e){return NextResponse.json({message:e instanceof Error?e.message:"金额核对失败，请重试"},{status:400})}
}
