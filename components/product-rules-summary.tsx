import { protectionSummary, type ProductRules } from '../lib/product-rules';
export function ProductRulesSummary({rules}:{rules?:ProductRules}){
 if(rules?.version!==1)return <p className="text-xs text-slate-500">此商品尚未填写新版配送和售后条款，请联系店铺确认。</p>;
 return <div className="space-y-2 text-xs leading-6 text-slate-600"><p>发货地：{rules.origin} · 付款后 {rules.dispatchHours} 小时内发货</p><p>配送地区：{rules.deliveryRegions.join('、')}</p>{protectionSummary(rules).map(s=><p key={s}>{s}</p>)}<p className="text-slate-400">以上为店铺承诺；质量问题等售后权益不因未勾选额外保障而排除。发货时限不等于送达时间。</p></div>;
}
