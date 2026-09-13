
"use client";
import { ArrowLeft, ChevronRight, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { catalogProducts, formatMoney } from "../../lib/data";
import { SkeletonImage } from "../ui";

export function ServicePage({ title, onBack, onProduct }: { title: string; onBack:()=>void; onProduct:(id:string)=>void }) {
  const captions: Record<string,string> = {
    "外卖":"附近好味道，送到你手中","打车":"安全便捷，随时出发","超市":"日常所需，一站购齐",
    "酒店":"安心住宿，轻松预订","充值":"话费流量，快捷充值","旅游":"发现缅甸与周边目的地",
    "更多":"更多本地服务","闪兑":"服务筹备中，敬请期待"
  };
  return <main className="min-h-screen bg-[#f5f7f9] pb-8">
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      <button type="button" onClick={onBack} aria-label="返回" className="flex size-10 items-center justify-center rounded-full bg-slate-50"><ArrowLeft size={20}/></button>
      <div className="flex min-w-0 flex-1 items-center rounded-full bg-slate-100 px-3 py-2.5"><Search size={17} className="mr-2 text-slate-400"/><span className="text-sm text-slate-500">搜索{title}</span></div>
      <button type="button" aria-label="筛选" className="flex size-10 items-center justify-center text-slate-600"><SlidersHorizontal size={20}/></button>
    </header>
    <section className="bg-gradient-to-br from-[#728ba3] to-[#95a9ba] px-5 py-7 text-white">
      <p className="text-2xl font-bold">{title}</p><p className="mt-2 text-sm text-white/75">{captions[title] || "发现你身边的便捷生活"}</p>
    </section>
    {title==="闪兑" ? <section className="mx-4 mt-5 rounded-3xl bg-white p-8 text-center shadow-sm"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#edf2f5] text-[#7189a1]"><ChevronRight size={24}/></div><h2 className="mt-4 font-bold text-slate-800">闪兑即将开放</h2><p className="mt-2 text-xs leading-5 text-slate-500">页面入口已经预留，交易功能暂不开放。</p></section> :
    <section className="px-4 py-5"><div className="mb-4 flex items-center justify-between"><b className="text-slate-800">为你推荐</b><span className="flex items-center gap-1 text-xs text-slate-400"><MapPin size={13}/>附近优先</span></div>
      <div className="space-y-3">{catalogProducts.map(p=><button type="button" key={p.id} onClick={()=>onProduct(p.id)} className="flex w-full gap-3 rounded-3xl bg-white p-2.5 text-left shadow-sm"><SkeletonImage className="h-24 w-24 shrink-0 rounded-2xl" label={p.imageLabel}/><span className="min-w-0 flex-1 py-1"><b className="line-clamp-2 text-sm text-slate-800">{p.title}</b><span className="mt-2 block text-xs text-slate-400">{p.store} · {p.distance}</span><strong className="mt-3 block text-[#d96f68]">{formatMoney(p.price)}</strong></span></button>)}</div>
    </section>}
  </main>;
}
