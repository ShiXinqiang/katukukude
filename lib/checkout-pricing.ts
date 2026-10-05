import {createHash} from 'node:crypto';
import {resolveSale,protectionSummary} from './product-rules';
import type {requestedItems} from './order-rules';
export function priceCheckout(products:any[],lines:ReturnType<typeof requestedItems>,region?:string){
 const groups=new Map<string,any[]>();const counts=new Map<string,number>();
 for(const line of lines)counts.set(line.productId,(counts.get(line.productId)||0)+line.quantity);
 if(products.length!==counts.size)throw Error('部分商品已下架，请重新选择');
 for(const p of [...products].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
  if(p.status&&p.status!=='active'||p.stock<(counts.get(p.id)||0))throw Error(`${p.title||'商品'}已下架或库存不足`);
  for(const line of lines.filter(l=>l.productId===p.id).sort((a,b)=>a.spec.localeCompare(b.spec))){
   const sale=resolveSale(p,line.spec,line.quantity,region);
   const snapshot=sale.rules?.version===1?{...sale.rules,variants:[]}:null;
   const row={productId:p.id,title:p.title,spec:line.spec,unitPrice:sale.price,quantity:line.quantity,subtotal:Math.round(sale.price*line.quantity*100)/100,store:p.store_name_cn,shippingFee:p.free_shipping?0:Number(p.shipping_fee),image:sale.variant?.image||p.images?.[0]||'',rules:snapshot,serviceGuarantees:snapshot?protectionSummary(snapshot):[],shippingRegion:region||''};
   groups.set(p.merchant_id,[...(groups.get(p.merchant_id)||[]),row]);
  }
 }
 const rows=Array.from(groups.values()).flat();const subtotal=Math.round(rows.reduce((n,r)=>n+r.subtotal,0)*100)/100;
 const shipping=Array.from(groups.values()).reduce((n,rs)=>n+Math.max(0,...rs.map(r=>r.shippingFee)),0);
 const total=Math.round((subtotal+shipping)*100)/100;
 if(total>9999999999.99)throw Error('订单金额超出范围，请分批下单');
 const quoteToken=createHash('sha256').update(JSON.stringify(rows)).digest('hex');
 return{groups,rows,subtotal,shipping,total,quoteToken};
}
