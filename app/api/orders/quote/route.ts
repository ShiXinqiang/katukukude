import {NextResponse} from 'next/server';
import {ensureMerchantSchema} from '../../../../lib/merchant';
import {requestedItems} from '../../../../lib/order-rules';
import {priceCheckout} from '../../../../lib/checkout-pricing';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{
 const body=await request.json(),lines=requestedItems(body.items),db=await ensureMerchantSchema();
 const result=await db.query("SELECT p.*,m.store_name_cn FROM products p JOIN merchants m ON m.id=p.merchant_id WHERE p.id=ANY($1::text[]) AND p.status='active' AND m.status='active'",[Array.from(new Set(lines.map(l=>l.productId)))]);
 const {groups,...quote}=priceCheckout(result.rows,lines,body.shippingRegion);
 return NextResponse.json(quote);
}catch(e){return NextResponse.json({message:e instanceof Error?e.message:'金额核对失败'},{status:400})}}
