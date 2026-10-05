export function catalogQuery(params:URLSearchParams){
 const values:unknown[]=[],where=["p.status='active'","p.stock>0","m.status='active'"];
 const add=(value:unknown,sql:(bind:string)=>string)=>{values.push(value);where.push(sql('$'+values.length))};
 const id=(params.get('id')||'').trim().slice(0,100),q=(params.get('q')||'').trim().slice(0,100),category=(params.get('category')||'').trim().slice(0,80),store=(params.get('store')||'').trim().slice(0,100),region=(params.get('region')||'').trim().slice(0,30);
 if(id)add(id,b=>`p.id=${b}`);
 if(q)add('%'+q.replace(/[\\%_]/g,'\\$&')+'%',b=>`(p.title ILIKE ${b} OR p.subtitle ILIKE ${b} OR p.description ILIKE ${b} OR p.category ILIKE ${b} OR m.store_name_cn ILIKE ${b})`);
 if(store)add(store,b=>`m.id=${b}`);
 if(category)add(category,b=>`p.category=${b}`);
 if(region)add(region,b=>`p.product_rules->'deliveryRegions' ? ${b}`);
 if(params.get('freeShipping')==='true')where.push('p.free_shipping=TRUE');
 const section=params.get('section');
 if(section==='featured')where.push('p.is_featured=TRUE');
 if(section==='recommended')where.push('p.is_recommended=TRUE');
 if(section==='official')where.push('p.is_official=TRUE');
 if(section==='sale')where.push("(p.original_price>p.price OR (p.promotion_title IS NOT NULL AND (p.promotion_start IS NULL OR p.promotion_start<=NOW()) AND (p.promotion_end IS NULL OR p.promotion_end>=NOW())))");
 const price=(key:string)=>{const raw=params.get(key);if(raw===null||raw==='')return null;const n=Number(raw);if(!Number.isFinite(n)||n<0||n>999999999)throw Error('价格筛选范围无效');return n};
 const min=price('minPrice'),max=price('maxPrice');if(min!==null&&max!==null&&min>max)throw Error('最低价不能高于最高价');
 if(min!==null)add(min,b=>`p.price>=${b}`);if(max!==null)add(max,b=>`p.price<=${b}`);
 const orders:Record<string,string>={default:'p.is_featured DESC,p.is_recommended DESC,p.sort_order DESC,p.updated_at DESC,p.id',sales:'p.sales_count DESC,p.updated_at DESC,p.id',priceAsc:'p.price ASC,p.id',priceDesc:'p.price DESC,p.id',newest:'p.created_at DESC,p.id'};
 const integer=(key:string,fallback:number,max:number)=>{const raw=params.get(key);if(!raw)return fallback;const n=Number(raw);if(!Number.isInteger(n)||n<1||n>max)throw Error('分页参数无效');return n;};
 const page=integer('page',1,10000),limit=integer('limit',60,60);
 return{values,where:where.join(' AND '),order:orders[params.get('sort')||'default']||orders.default,page,limit,id};
}
