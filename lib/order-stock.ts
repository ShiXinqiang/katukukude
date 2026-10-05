import {specCombinations} from './product-rules';
import type {PoolClient} from 'pg';
export async function restoreOrderStock(client:PoolClient,order:any){
 const counts=new Map<string,number>();
 for(const item of Array.isArray(order.items)?order.items:[])if(typeof item.productId==='string'&&Number.isInteger(item.quantity)&&item.quantity>0)counts.set(item.productId,(counts.get(item.productId)||0)+item.quantity);
 for(const [id,quantity] of Array.from(counts).sort(([a],[b])=>a.localeCompare(b))){
  const p=(await client.query('SELECT product_rules,specifications FROM products WHERE id=$1 AND merchant_id=$2 FOR UPDATE',[id,order.merchant_id])).rows[0];
  if(p){const keys=specCombinations(p.specifications||[]);if((order.items||[]).some((i:any)=>i.productId===id&&keys.length&&!keys.includes(i.spec)))throw Error("商品规格已变化，不能自动恢复库存；请取消恢复库存并单独核实");}
  if(p?.product_rules?.variants?.length){const rules=p.product_rules;rules.variants=rules.variants.map((v:any)=>({...v,stock:v.stock+(order.items||[]).filter((i:any)=>i.productId===id&&i.spec===v.spec).reduce((n:number,i:any)=>n+i.quantity,0)}));await client.query('UPDATE products SET product_rules=$2::jsonb WHERE id=$1',[id,JSON.stringify(rules)]);}
  await client.query('UPDATE products SET stock=stock+$2,sales_count=GREATEST(0,sales_count-$2),updated_at=NOW() WHERE id=$1 AND merchant_id=$3',[id,quantity,order.merchant_id]);
 }
}
export function validateShipment(value:any){
 const kind=value?.kind,carrier=String(value?.carrier||'').trim().slice(0,80),tracking=String(value?.tracking||'').trim().slice(0,120),contact=String(value?.contact||'').trim().slice(0,80),phone=String(value?.phone||'').trim().slice(0,32);
 if(kind!=='courier'&&kind!=='local')throw Error('请选择快递或同城配送');
 if(kind==='courier'&&(!carrier||!tracking))throw Error('请填写物流公司和运单号');
 if(kind==='local'&&(!contact||!phone))throw Error('请填写配送联系人和电话');
 return {kind,carrier,tracking,contact,phone,shippedAt:new Date().toISOString()};
}
