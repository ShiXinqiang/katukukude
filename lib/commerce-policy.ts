import type {PoolClient} from 'pg';
import {PRODUCT_CATEGORIES} from './product-rules';
import {ensureMerchantSchema} from './merchant';
export type CommercePolicy={categories:string[];guarantees:string[];revision:number};
export const DEFAULT_POLICY:CommercePolicy={categories:PRODUCT_CATEGORIES,guarantees:['returns','damage','warranty'],revision:0};
export async function readCommercePolicy(client?:PoolClient){const db=client||await ensureMerchantSchema();const r=await db.query("SELECT value,revision FROM commerce_settings WHERE key='product_policy'");return r.rows[0]?{...r.rows[0].value,revision:r.rows[0].revision} as CommercePolicy:DEFAULT_POLICY;}
export function validateCommercePolicy(value:any){
 if(!Array.isArray(value.categories)||value.categories.length<1||value.categories.length>50)throw Error('请设置1至50个商品分类');
 const categories=value.categories.map((x:any)=>typeof x==='string'?x.trim():'');if(categories.some((x:string)=>!x||x.length>30)||new Set(categories).size!==categories.length)throw Error('分类不能重复、为空或超过30字');
 if(!Array.isArray(value.guarantees)||value.guarantees.some((x:string)=>!['returns','damage','warranty'].includes(x)))throw Error('保障类型无效');
 return{categories,guarantees:Array.from(new Set(value.guarantees))};
}
