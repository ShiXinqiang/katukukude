import {readCommercePolicy} from './commerce-policy';
import { randomUUID } from 'node:crypto';
import { ensureMerchantSchema } from './merchant';
import { normalizeProduct } from './product-rules';

export async function saveProduct(body:any,actorId:string,merchantId?:string,id?:string,admin=false){
 const db=await ensureMerchantSchema(),client=await db.connect();
 try{
  await client.query('BEGIN');
  const row=id?(await client.query('SELECT * FROM products WHERE id=$1 FOR UPDATE',[id])).rows[0]:null;
  if(id&&(!row||(!admin&&row.merchant_id!==merchantId)))throw Error('商品不存在或无权操作');
  if(row&&body.expectedUpdatedAt&&new Date(body.expectedUpdatedAt).getTime()!==new Date(row.updated_at).getTime())throw Error('商品已被修改或库存已变化，请刷新后再编辑');
  const policy=await readCommercePolicy(client);
  const actualMerchant=row?.merchant_id||merchantId;
  const merchant=(await client.query('SELECT status FROM merchants WHERE id=$1',[actualMerchant])).rows[0];
  if(!merchant)throw Error('店铺不存在');
  let status=row?.status||'draft';
  const archive=body.action==='archive'||body.status==='archived';
  const opsOnly=admin&&Object.keys(body).every(k=>['status','rejectionReason','isOfficial','isFeatured','isRecommended','badge','sortOrder','expectedUpdatedAt'].includes(k));
  let product:any;
  if(archive)status='archived';
  else if(opsOnly){
   if(body.status==='active'&&status!=='pending')throw Error('只能审核通过待审核商品');
   if(body.status==='rejected'&&(status!=='pending'||!String(body.rejectionReason||'').trim()))throw Error('只能拒绝待审核商品，且必须填写原因');
   if(body.status!==undefined&&!['active','rejected'].includes(body.status))throw Error('审核状态操作无效');
   status=body.status||status;
   if(status==='active')product=normalizeProduct({},row,true,policy.categories,policy.guarantees);
  }else{
   if(row?.status==='pending')throw Error('审核中的商品请先撤回（下架）再修改');
   const submit=body.publish===true||body.action==='submit';
   product=normalizeProduct(body,row||{},submit,policy.categories,policy.guarantees);
   status=submit?'pending':'draft';
   if(row&&JSON.stringify(row.specifications)!==JSON.stringify(product.specifications)){
    const open=await client.query("SELECT 1 FROM orders WHERE merchant_id=$1 AND status NOT IN ('cancelled','completed') AND items @> $2::jsonb LIMIT 1",[actualMerchant,JSON.stringify([{productId:id}])]);
    if(open.rows.length)throw Error('该商品存在未结束订单，暂不能更改规格名称或组合');
   }
  }
  if(['pending','active'].includes(status)&&merchant.status!=='active')throw Error('店铺不可用，不能提交或上架商品');
  if(product){
   const urls=[...product.images,...product.rules.variants.map((v:any)=>v.image)].filter(Boolean);
   const media=urls.filter((s:string)=>s.startsWith('/api/product-images/')).map((s:string)=>s.split('/').pop());
   if(media.length){const owned=await client.query('SELECT id FROM product_media WHERE id=ANY($1::text[]) AND merchant_id=$2',[media,actualMerchant]);if(new Set(owned.rows.map((r:any)=>r.id)).size!==new Set(media).size)throw Error('只能使用本店上传的商品图片');}
  }
  const fields:Record<string,unknown>={status,updated_at:new Date().toISOString()};
  if(product)Object.assign(fields,{title:product.title,subtitle:product.subtitle||null,description:product.description,category:product.category,price:product.price,original_price:product.originalPrice,stock:product.stock,images:JSON.stringify(product.images),tags:JSON.stringify(product.tags),specifications:JSON.stringify(product.specifications),shipping_fee:product.shippingFee,free_shipping:product.freeShipping,service_guarantees:JSON.stringify(product.serviceGuarantees),promotion_title:product.promotionTitle||null,promotion_start:product.promotionStart,promotion_end:product.promotionEnd,product_rules:JSON.stringify(product.rules)});
  if(status==='pending'||status==='active')fields.rejection_reason=null;
  if(admin){
   for(const [key,column] of [['isOfficial','is_official'],['isFeatured','is_featured'],['isRecommended','is_recommended']])if(body[key]!==undefined)fields[column]=body[key]===true;
   if(body.badge!==undefined)fields.badge=String(body.badge).trim().slice(0,32)||null;
   if(body.sortOrder!==undefined){const n=Number(body.sortOrder);if(!Number.isInteger(n)||Math.abs(n)>9999)throw Error('排序必须为-9999至9999的整数');fields.sort_order=n;}
   if(status==='rejected')fields.rejection_reason=String(body.rejectionReason).trim().slice(0,1000);
  }
  const target=id||randomUUID();
  const keys=Object.keys(fields),values=Object.values(fields);
  if(row)await client.query(`UPDATE products SET ${keys.map((k,i)=>`${k}=$${i+2}`).join(',')} WHERE id=$1`,[target,...values]);
  else await client.query(`INSERT INTO products(id,merchant_id,${keys.join(',')}) VALUES($1,$2,${keys.map((_,i)=>'$'+(i+3)).join(',')})`,[target,actualMerchant,...values]);
  await client.query('INSERT INTO commerce_audit(id,actor_id,target_id,action,details) VALUES($1,$2,$3,$4,$5::jsonb)',[randomUUID(),actorId,target,row?'product.update':'product.create',JSON.stringify({from:row?.status||null,to:status,fields:keys,reason:fields.rejection_reason||null})]);
  await client.query('COMMIT');return {id:target,status};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
export async function deleteProduct(id:string,actorId:string,merchantId?:string){
 const db=await ensureMerchantSchema(),client=await db.connect();
 try{await client.query('BEGIN');const row=(await client.query('SELECT merchant_id,status FROM products WHERE id=$1 FOR UPDATE',[id])).rows[0];
 if(!row||(merchantId&&row.merchant_id!==merchantId))throw Error('商品不存在或无权操作');
 if(!['draft','rejected','archived'].includes(row.status))throw Error('请先下架商品，再删除');
 const used=await client.query('SELECT 1 FROM orders WHERE items @> $1::jsonb LIMIT 1',[JSON.stringify([{productId:id}])]);if(used.rows.length)throw Error('已有订单的商品不能删除，请保持下架以保留售后记录');
 await client.query('DELETE FROM products WHERE id=$1',[id]);await client.query('INSERT INTO commerce_audit(id,actor_id,target_id,action) VALUES($1,$2,$3,$4)',[randomUUID(),actorId,id,'product.delete']);await client.query('COMMIT');return{success:true};
 }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
}
