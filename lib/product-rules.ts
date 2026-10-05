import { imageUrls } from './product-images';
export const PRODUCT_CATEGORIES = ['食品饮料','生鲜水果','服装鞋包','家居日用','数码家电','美妆个护','母婴用品','文体用品','其他商品'];
export const DELIVERY_REGIONS = ['仰光','曼德勒','内比都','勃固','实皆','马圭','伊洛瓦底','德林达依','克钦邦','克耶邦','克伦邦','钦邦','孟邦','若开邦','掸邦'];
export type Variant = { spec:string; price:number; stock:number; image:string };
export type ProductRules = { version:1; origin:string; dispatchHours:number; deliveryRegions:string[]; returns:{enabled:boolean;days:number;condition:string;freight:'merchant'|'buyer'}; damage:{enabled:boolean;days:number;condition:string}; warranty:{enabled:boolean;months:number;scope:string;contact:string}; variants:Variant[] };
export const emptyProductRules = ():ProductRules => ({version:1,origin:'',dispatchHours:48,deliveryRegions:[],returns:{enabled:false,days:7,condition:'',freight:'merchant'},damage:{enabled:false,days:2,condition:''},warranty:{enabled:false,months:12,scope:'',contact:''},variants:[]});
const text=(v:unknown,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const amount=(v:unknown,label:string,zero=true)=>{const n=Number(v);if(!Number.isFinite(n)||n<0||(!zero&&n===0)||n>999999999||Math.abs(n*100-Math.round(n*100))>0.0001)throw Error(label+'必须是有效金额（最多2位小数）');return n;};
const integer=(v:unknown,label:string,max=1000000,min=0)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw Error(label+`必须在${min}至${max}之间`);return n;};
export function specCombinations(specs:{name:string;values:string[]}[]):string[]{let rows=[''];for(const s of specs){rows=rows.flatMap(r=>s.values.map(v=>(r?r+'；':'')+s.name+'：'+v));if(rows.length>100)throw Error('最多支持100个规格组合');}return specs.length?rows:[];}
export function normalizeRules(value:any, publish:boolean):ProductRules {
 const d=emptyProductRules(),r=value&&typeof value==='object'?value:{};
 const result:ProductRules={version:1,origin:text(r.origin,200),dispatchHours:integer(r.dispatchHours??48,'发货时限',720,1),deliveryRegions:Array.isArray(r.deliveryRegions)?Array.from(new Set(r.deliveryRegions.filter((x:string)=>DELIVERY_REGIONS.includes(x)))):[],returns:{enabled:r.returns?.enabled===true,days:integer(r.returns?.days??7,'退货时限',30,1),condition:text(r.returns?.condition),freight:r.returns?.freight==='buyer'?'buyer':'merchant'},damage:{enabled:r.damage?.enabled===true,days:integer(r.damage?.days??2,'破损申请时限',30,1),condition:text(r.damage?.condition)},warranty:{enabled:r.warranty?.enabled===true,months:integer(r.warranty?.months??12,'保修期限',60,1),scope:text(r.warranty?.scope),contact:text(r.warranty?.contact,120)},variants:[]};
 if(publish&&(!result.origin||!result.deliveryRegions.length))throw Error('请填写发货地点并选择配送地区');
 if(result.returns.enabled&&!result.returns.condition)throw Error('请填写退货条件');
 if(result.damage.enabled&&!result.damage.condition)throw Error('请填写破损补发的凭证和处理方式');
 if(result.warranty.enabled&&(!result.warranty.scope||!result.warranty.contact))throw Error('请填写保修范围和联系方式');
 if(r.variants!==undefined&&!Array.isArray(r.variants))throw Error('规格库存格式无效');
 if((r.variants?.length||0)>100)throw Error('最多支持100个规格组合');
 result.variants=(r.variants||[]).map((v:any)=>({spec:text(v.spec,300),price:amount(v.price,'规格价格',!publish),stock:integer(v.stock,'规格库存'),image:imageUrls([v.image])[0]||''}));
 return result;
}
export function protectionSummary(r?:ProductRules|null):string[]{if(!r)return[];return [r.returns?.enabled?`${r.returns.days}天内支持退货；条件：${r.returns.condition}；退货运费由${r.returns.freight==='buyer'?'买家':'商家'}承担`:'未承诺无理由退货；质量问题可联系售后',r.damage?.enabled?`收货后${r.damage.days}天内可申请破损补发；${r.damage.condition}`:'',r.warranty?.enabled?`店铺保修${r.warranty.months}个月；范围：${r.warranty.scope}；联系：${r.warranty.contact}`:''].filter(Boolean);}
export function normalizeProduct(body:any,current:any={},publish=false,categories:string[]=PRODUCT_CATEGORIES,guarantees:string[]=['returns','damage','warranty']){
 const get=(key:string,column=key,fallback:any='')=>body[key]===undefined?(current[column]??fallback):body[key];
 const title=text(get('title'),200),description=text(get('description'),5000),category=text(get('category'),80);
 if(!title)throw Error('请填写商品名称后保存草稿');
 if(publish&&(title.length<4||description.length<10||!categories.includes(category)))throw Error('提交审核需要至少4字名称、10字说明，并选择平台分类');
 const rawSpecs=get('specifications','specifications',[]);if(!Array.isArray(rawSpecs)||rawSpecs.length>3)throw Error('最多支持3组规格');
 const specifications=rawSpecs.map((s:any)=>({name:text(s.name,30),values:Array.isArray(s.values)?s.values.map((v:any)=>text(v,40)):[]}));
 if(specifications.some(s=>!s.name||!s.values.length||s.values.length>20||new Set(s.values).size!==s.values.length||[s.name,...s.values].some((v:string)=>!v||/[；：/:;]/.test(v)))||new Set(specifications.map(s=>s.name)).size!==specifications.length)throw Error('规格名称和值不能为空、重复或包含分隔符');
 const rules=normalizeRules(get('rules','product_rules',{}),publish),combinations=specCombinations(specifications);
 if(rules.variants.length&&(new Set(rules.variants.map(v=>v.spec)).size!==rules.variants.length||rules.variants.length!==combinations.length||combinations.some(s=>!rules.variants.some(v=>v.spec===s))))throw Error('请重新生成完整的规格价格库存表');
 if(publish&&combinations.length&&!rules.variants.length)throw Error('请为每个规格组合设置价格和库存');
 if(publish&&(['returns','damage','warranty'] as const).some(k=>rules[k].enabled&&!guarantees.includes(k)))throw Error('所选保障已被平台停用，请调整后重新提交');
 const price=rules.variants.length?Math.min(...rules.variants.map(v=>v.price)):amount(get('price','price',0),'销售价',!publish);
 const stock=rules.variants.length?rules.variants.reduce((n,v)=>n+v.stock,0):integer(get('stock','stock',0),'库存');
 if(stock>1000000)throw Error('总库存不能超过100万');if(publish&&stock<1)throw Error('库存大于0才能提交审核');
 const originalRaw=get('originalPrice','original_price',null),originalPrice=originalRaw===null||originalRaw===''?null:amount(originalRaw,'划线原价');
 if(originalPrice!==null&&originalPrice<Math.max(price,...rules.variants.map(v=>v.price)))throw Error('划线原价不能低于任何规格的售价');
 const rawImages=get('images','images',[]),images=imageUrls(rawImages);
 if(!Array.isArray(rawImages)||rawImages.length>8||images.length!==rawImages.length)throw Error('图片最多8张，地址必须有效且不能重复');
 if(publish&&!images.length)throw Error('请至少上传一张商品图片');
 const freeShipping=get('freeShipping','free_shipping',false)===true,shippingFee=freeShipping?0:amount(get('shippingFee','shipping_fee',0),'运费');
 const date=(v:any)=>{if(!v)return null;const d=new Date(v);if(!Number.isFinite(d.getTime()))throw Error('促销时间无效');return d.toISOString();};
 const promotionTitle=text(get('promotionTitle','promotion_title'),80),promotionStart=date(get('promotionStart','promotion_start',null)),promotionEnd=date(get('promotionEnd','promotion_end',null));
 if(promotionTitle&&(!promotionStart||!promotionEnd))throw Error('促销需填写开始和结束时间');
 if(promotionStart&&promotionEnd&&promotionStart>=promotionEnd)throw Error('促销结束时间必须晚于开始时间');
 const tags=(Array.isArray(get('tags','tags',[]))?get('tags','tags',[]):[]).map((x:any)=>text(x,30)).filter(Boolean).slice(0,8);
 if(tags.some((x:string)=>/平台担保|官方认证|正品认证/.test(x)))throw Error('认证和平台担保不能作为自定义标签');
 return {title,subtitle:text(get('subtitle'),160),description,category,price,originalPrice,stock,images,tags,specifications,shippingFee,freeShipping,serviceGuarantees:protectionSummary(rules),promotionTitle,promotionStart,promotionEnd,rules};
}
export function resolveSale(product:any,spec:string,quantity:number,region?:string){
 const rules:ProductRules|undefined=product.product_rules||product.rules;
 if(rules?.version===1&&(!region||!rules.deliveryRegions.includes(region)))throw Error(`${product.title||'商品'}不支持当前配送地区，请选择支持的省邦`);
 const specs=product.specifications||[];const expected=specCombinations(specs);
 if(expected.length&&!expected.includes(spec))throw Error(`${product.title||'商品'}请选择完整有效的规格`);
 if(!expected.length&&spec!=='默认规格')throw Error('商品规格已变化，请重新选择');
 const variant=rules?.variants?.find(v=>v.spec===spec);
 if(rules?.variants?.length&&!variant)throw Error('商品规格已变化，请重新选择');
 if(quantity>(variant?.stock??product.stock))throw Error(`${product.title||'商品'}库存不足`);
 return {price:variant?.price??Number(product.price),variant,rules};
}
