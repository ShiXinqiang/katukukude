
"use client";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleAlert, Home, MapPin, Navigation, Plus, Trash2, X } from "lucide-react";
import { isGoogleMapsLink, readAddresses, saveAddresses, type SavedAddress } from "../../lib/local-profile";

function Header({title,onBack}:{title:string;onBack:()=>void}) {
 return <header className="sticky top-0 z-20 flex items-center border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur"><button type="button" onClick={onBack} aria-label="返回" className="flex size-10 items-center justify-center rounded-full bg-slate-50"><ArrowLeft size={20}/></button><h1 className="flex-1 pr-10 text-center text-[17px] font-bold text-slate-800">{title}</h1></header>;
}

export function AddressesPage({onBack}:{onBack:()=>void}) {
 const [items,setItems]=useState<SavedAddress[]>([]);
 const [editing,setEditing]=useState(false);
 const [form,setForm]=useState({label:"家",contact:"",phone:"",detail:"",googleMapsUrl:""});
 useEffect(()=>setItems(readAddresses()),[]);
 const persist=(next:SavedAddress[])=>{setItems(next);saveAddresses(next)};
 const submit=()=>{
   if(!form.contact.trim()||!form.phone.trim()||!form.detail.trim()) return;
   const next=[...items,{...form,id:crypto.randomUUID(),isHome:items.length===0}];persist(next);setEditing(false);setForm({label:"家",contact:"",phone:"",detail:"",googleMapsUrl:""});
 };
 if(editing) return <main className="min-h-screen bg-[#f5f7f9]"><Header title="添加地址" onBack={()=>setEditing(false)}/><div className="space-y-3 p-4">
   <section className="overflow-hidden rounded-3xl bg-white px-4 shadow-sm">
    {[["地址标签","label","例如：家、公司"],["联系人","contact","收货人姓名"],["手机号","phone","中国或缅甸手机号"],["详细地址","detail","省/邦、城市、镇区、街道门牌"]].map(([label,key,placeholder])=><label key={key} className="flex items-center border-b border-slate-100 py-4 last:border-0"><span className="w-20 text-sm font-medium text-slate-700">{label}</span><input value={form[key as keyof typeof form]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder} className="min-w-0 flex-1 text-sm outline-none placeholder:text-slate-300"/></label>)}
   </section>
   <section className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex items-center gap-2"><MapPin size={18} className="text-[#7189a1]"/><b className="text-sm text-slate-800">Google 地图位置链接</b></div><input value={form.googleMapsUrl} onChange={e=>setForm({...form,googleMapsUrl:e.target.value})} placeholder="粘贴 Google Maps 分享链接" className="mt-3 w-full rounded-2xl bg-slate-50 px-3 py-3 text-sm outline-none"/><p className="mt-2 text-[11px] leading-5 text-slate-400">打开地图，长按准确位置后点“分享”，复制链接并粘贴。只有带地图链接的地址才能用于“到家”导航。</p><a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#9dafbf] py-3 text-sm font-semibold text-[#607d96]"><Navigation size={17}/>打开 Google 地图自动定位</a></section>
   <button type="button" onClick={submit} className="w-full rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white">保存地址</button>
 </div></main>;
 return <main className="min-h-screen bg-[#f5f7f9] pb-28"><Header title="地址管理" onBack={onBack}/><div className="space-y-3 p-4">{items.length===0?<div className="rounded-3xl bg-white p-9 text-center"><MapPin size={28} className="mx-auto text-slate-300"/><b className="mt-3 block text-slate-700">还没有收货地址</b><p className="mt-2 text-xs text-slate-400">添加后可以设为默认到家地址</p></div>:items.map(item=><article key={item.id} className="rounded-3xl bg-white p-4 shadow-sm"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf2f5] text-[#7189a1]">{item.isHome?<Home size={19}/>:<MapPin size={19}/>}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><b className="text-sm text-slate-800">{item.label}</b>{item.isHome&&<span className="rounded-full bg-[#e8f0f4] px-2 py-0.5 text-[10px] text-[#607d96]">到家地址</span>}</div><p className="mt-1 text-sm text-slate-600">{item.detail}</p><p className="mt-2 text-xs text-slate-400">{item.contact} · {item.phone}</p>{!isGoogleMapsLink(item.googleMapsUrl)&&<p className="mt-2 flex items-center gap-1 text-[11px] text-amber-600"><CircleAlert size={13}/>缺少有效 Google 地图链接</p>}</div></div><div className="mt-4 flex justify-end gap-2">{!item.isHome&&<button type="button" onClick={()=>persist(items.map(x=>({...x,isHome:x.id===item.id})))} className="rounded-full bg-[#edf2f5] px-3 py-2 text-xs font-medium text-[#607d96]">设为到家地址</button>}<button type="button" aria-label="删除" onClick={()=>persist(items.filter(x=>x.id!==item.id))} className="flex size-8 items-center justify-center rounded-full bg-red-50 text-red-400"><Trash2 size={15}/></button></div></article>)}</div><div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 bg-white/95 p-4 backdrop-blur"><button type="button" onClick={()=>setEditing(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white"><Plus size={18}/>添加新地址</button></div></main>;
}

export function HomeRoutePage({onBack,onManage}:{onBack:()=>void;onManage:()=>void}) {
 const [items,setItems]=useState<SavedAddress[]>([]); const [selected,setSelected]=useState("");
 useEffect(()=>{const a=readAddresses();setItems(a);setSelected(a.find(x=>x.isHome)?.id||a[0]?.id||"")},[]);
 const chosen=items.find(x=>x.id===selected); const valid=!!chosen&&isGoogleMapsLink(chosen.googleMapsUrl);
 const go=()=>{
   if(!chosen||!valid) return;
   const destination=encodeURIComponent(chosen.googleMapsUrl);
   window.open(\`https://www.google.com/maps/dir/?api=1&destination=\${destination}&travelmode=driving\`,"_blank","noopener,noreferrer");
 };
 return <main className="min-h-screen bg-[#f5f7f9] pb-28"><Header title="导航到家" onBack={onBack}/><section className="bg-gradient-to-br from-[#7189a1] to-[#94a7b8] px-5 py-7 text-white"><Home size={26}/><h2 className="mt-3 text-xl font-bold">选择要回去的地址</h2><p className="mt-2 text-sm text-white/75">继续后将从你当前的位置打开 Google 地图网页版导航</p></section><div className="space-y-3 p-4">
 {items.length===0?<button type="button" onClick={onManage} className="flex w-full items-center justify-between rounded-3xl bg-white p-5 text-left shadow-sm"><span><b className="text-sm text-slate-800">先添加到家地址</b><span className="mt-1 block text-xs text-slate-400">需要保存 Google 地图位置链接</span></span><ChevronRight size={19} className="text-slate-400"/></button>:items.map(item=><button type="button" key={item.id} onClick={()=>setSelected(item.id)} className={\`flex w-full items-start gap-3 rounded-3xl border bg-white p-4 text-left \${selected===item.id?"border-[#7189a1]":"border-transparent"}\`}><span className={\`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border \${selected===item.id?"border-[#7189a1] bg-[#7189a1] text-white":"border-slate-300"}\`}>{selected===item.id&&<Check size={13}/>}</span><span className="flex-1"><b className="text-sm text-slate-800">{item.label}{item.isHome&&" · 默认到家"}</b><span className="mt-1 block text-sm text-slate-600">{item.detail}</span>{!isGoogleMapsLink(item.googleMapsUrl)&&<span className="mt-2 flex items-center gap-1 text-[11px] text-amber-600"><CircleAlert size={13}/>此地址没有有效 Google 地图链接，不能导航</span>}</span></button>)}
 <button type="button" onClick={onManage} className="flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-[#607d96]"><Plus size={17}/>管理地址</button>
 </div><div className="fixed bottom-0 left-1/2 w-full max-w-[390px] -translate-x-1/2 border-t border-slate-100 bg-white/95 p-4 backdrop-blur"><button type="button" disabled={!valid} onClick={go} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white disabled:bg-slate-300"><Navigation size={18}/>继续并开始导航</button></div></main>;
}
