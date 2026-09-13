"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Check, ChevronRight, Heart, MapPin, MessageSquare, Moon, PackageOpen, SlidersHorizontal, Sun } from "lucide-react";
import type { ProductData, View } from "../../lib/data";
import { formatMoney } from "../../lib/data";
import { SkeletonImage } from "../ui";

function Header({title,onBack}:{title:string;onBack:()=>void}){return <header className="sticky top-0 z-30 flex items-center border-b border-white/60 bg-white/65 px-4 py-3 backdrop-blur-2xl"><button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-white/70" aria-label="返回"><ArrowLeft size={20}/></button><h1 className="flex-1 pr-10 text-center font-bold">{title}</h1></header>}

function SavedProductsPage({kind,onBack,onProduct}:{kind:"favorites"|"likes";onBack:()=>void;onProduct:(id:string)=>void}){
 const title=kind==="favorites"?"我的收藏":"我的点赞",Icon=kind==="favorites"?Bookmark:Heart;
 const [items,setItems]=useState<ProductData[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;let ids:string[]=[];try{const parsed=JSON.parse(localStorage.getItem(kind==="favorites"?"katu.favorites":"katu.likes")||"[]");ids=Array.isArray(parsed)?parsed.filter(x=>typeof x==="string"):[]}catch{}Promise.all(ids.map(id=>fetch("/api/catalog?id="+encodeURIComponent(id),{cache:"no-store"}).then(r=>r.json()).then(x=>x.product as ProductData|null).catch(()=>null))).then(rows=>{if(active)setItems(rows.filter(Boolean) as ProductData[])}).finally(()=>active&&setLoading(false));return()=>{active=false}},[kind]);
 return <main className="min-h-screen bg-transparent pb-8"><Header title={title} onBack={onBack}/><section className="px-4 pt-5"><div className="mb-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm"><span className="flex size-11 items-center justify-center rounded-2xl bg-[#e8eef2] text-[#7189a1]"><Icon size={21}/></span><div><b className="text-sm">{title}</b><p className="mt-1 text-xs text-slate-400">共 {items.length} 条内容</p></div></div>{loading?<div className="space-y-3">{[1,2,3].map(x=><div key={x} className="h-28 animate-pulse rounded-3xl bg-white/60"/>)}</div>:items.length?<div className="space-y-3">{items.map(p=><button key={p.id} onClick={()=>onProduct(p.id)} className="flex w-full gap-3 rounded-3xl bg-white p-3 text-left shadow-sm"><SkeletonImage className="size-24 shrink-0 rounded-2xl" label={p.imageLabel}/><span className="min-w-0 flex-1"><b className="line-clamp-2 text-sm">{p.title}</b><small className="mt-2 block truncate text-slate-400">{p.store} · {p.sales}</small><b className="mt-3 block text-[#d96f68]">{formatMoney(p.price)}</b></span><ChevronRight size={17} className="self-center text-slate-300"/></button>)}</div>:<div className="rounded-3xl bg-white p-10 text-center shadow-sm"><PackageOpen size={34} className="mx-auto text-slate-300"/><b className="mt-4 block text-sm">暂无{kind==="favorites"?"收藏":"点赞"}</b><p className="mt-2 text-xs leading-5 text-slate-400">{kind==="favorites"?"在商品详情点击收藏后会出现在这里":"点赞过的内容会集中显示在这里"}</p></div>}</section></main>
}
export function FavoritesPage(p:{onBack:()=>void;onProduct:(id:string)=>void}){return <SavedProductsPage kind="favorites" {...p}/>}
export function LikesPage(p:{onBack:()=>void;onProduct:(id:string)=>void}){return <SavedProductsPage kind="likes" {...p}/>}

type GlassMode="clear"|"balanced"|"solid";
type SurfaceTheme="light"|"dark";
const modes:{key:GlassMode;name:string;alpha:string;blur:string}[]=[{key:"clear",name:"高透明",alpha:".58",blur:"26px"},{key:"balanced",name:"平衡",alpha:".72",blur:"22px"},{key:"solid",name:"高可读",alpha:".86",blur:"16px"}];

export function SettingsPage({onBack,onNavigate}:{onBack:()=>void;onNavigate:(view:View)=>void}){
 const [mode,setMode]=useState<GlassMode>(()=>(typeof window!=="undefined"?localStorage.getItem("katu.theme.mode") as GlassMode:null)||"balanced");
 const [surface,setSurface]=useState<SurfaceTheme>(()=>(typeof window!=="undefined"&&localStorage.getItem("katu.theme.surface")==="dark")?"dark":"light");
 const apply=(nextMode=mode,nextSurface=surface)=>{const selected=modes.find(x=>x.key===nextMode)||modes[1];document.documentElement.dataset.katuTheme=nextSurface;document.documentElement.style.setProperty("--katu-glass-alpha",selected.alpha);document.documentElement.style.setProperty("--katu-blur",selected.blur);localStorage.setItem("katu.theme.mode",nextMode);localStorage.setItem("katu.theme.surface",nextSurface)};
 useEffect(()=>apply(),[]);
 return <main className="min-h-screen bg-transparent pb-10"><Header title="设置" onBack={onBack}/><div className="space-y-4 p-4">
  <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-white/60"><Sun size={20}/></span><div><b>外观模式</b><p className="mt-1 text-xs text-slate-400">在白色与深黑玻璃之间切换</p></div></div><div className="mt-5 grid grid-cols-2 gap-3">
   {([{key:"light",name:"白色玻璃",icon:Sun},{key:"dark",name:"深黑玻璃",icon:Moon}] as const).map(x=>{const Icon=x.icon,active=surface===x.key;return <button key={x.key} onClick={()=>{setSurface(x.key);apply(mode,x.key)}} className={`relative flex h-28 flex-col items-center justify-center gap-3 rounded-3xl border ${active?"ring-2 ring-current":"opacity-75"}`}><span className="flex size-11 items-center justify-center rounded-full bg-white/20"><Icon size={21}/></span><b className="text-xs">{x.name}</b>{active&&<Check size={15} className="absolute right-3 top-3"/>}</button>})}
  </div></section>
  <section className="rounded-3xl bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-2xl bg-white/60"><SlidersHorizontal size={20}/></span><div><b>玻璃透明度</b><p className="mt-1 text-xs text-slate-400">全站即时生效</p></div></div><div className="mt-5 grid grid-cols-3 gap-2">{modes.map(x=><button key={x.key} onClick={()=>{setMode(x.key);apply(x.key,surface)}} className={`rounded-2xl border p-3 text-xs ${mode===x.key?"ring-2 ring-current":"opacity-70"}`}><span className="mx-auto mb-2 block size-8 rounded-xl border border-white/20 bg-white/10 shadow-sm"/>{x.name}{mode===x.key&&<Check size={13} className="mx-auto mt-2"/>}</button>)}</div></section>
  <section className="overflow-hidden rounded-3xl bg-white shadow-sm"><button onClick={()=>onNavigate("addresses")} className="flex w-full items-center gap-3 border-b border-white/10 p-4 text-sm"><MapPin size={19}/>地址与到家设置<ChevronRight size={17} className="ml-auto text-slate-400"/></button><button onClick={()=>onNavigate("messages")} className="flex w-full items-center gap-3 p-4 text-sm"><MessageSquare size={19}/>通知与消息<ChevronRight size={17} className="ml-auto text-slate-400"/></button></section>
 </div></main>
}
