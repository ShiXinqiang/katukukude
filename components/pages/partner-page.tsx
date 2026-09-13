
"use client";
import { useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, Mail, MessageCircle, Phone, Send, UserRound } from "lucide-react";

const channels=["手机号","电子邮箱","Telegram","微信","WhatsApp","Viber","Facebook Messenger"];
export function PartnerPage({onBack}:{onBack:()=>void}) {
 const [sent,setSent]=useState(false); const [submitting,setSubmitting]=useState(false); const [error,setError]=useState("");
 const [form,setForm]=useState({name:"",organization:"",advantages:"",channels:{} as Record<string,string>});
 const submit=async()=>{
   setError("");
   if(!form.name.trim()) return setError("请填写联系人姓名");
   if(form.advantages.trim().length<10) return setError("资源与优势至少填写10个字");
   if(!Object.values(form.channels).some(value=>value.trim())) return setError("请至少填写一种联系方式");
   setSubmitting(true);
   try{const response=await fetch("/api/partners",{method:"POST",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify(form)});const data=await response.json();if(!response.ok)throw new Error(data.message||"提交失败");setSent(true)}
   catch(error){setError(error instanceof Error?error.message:"提交失败，请稍后重试")}
   finally{setSubmitting(false)}
 };
 if(sent) return <main className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7f9] px-7 text-center"><span className="flex size-16 items-center justify-center rounded-full bg-[#e7f0ed] text-[#668c7e]"><CheckCircle2 size={31}/></span><h1 className="mt-5 text-xl font-bold text-slate-800">合作意向已提交</h1><p className="mt-2 text-sm leading-6 text-slate-500">平台超级管理员查看后，会通过你留下的联系方式与你沟通。</p><button type="button" onClick={onBack} className="mt-7 w-full rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white">返回首页</button></main>;
 return <main className="min-h-screen bg-[#f5f7f9] pb-8"><header className="flex items-center border-b border-slate-100 bg-white px-4 py-3"><button type="button" onClick={onBack} aria-label="返回" className="flex size-10 items-center justify-center rounded-full bg-slate-50"><ArrowLeft size={20}/></button><h1 className="flex-1 pr-10 text-center text-[17px] font-bold text-slate-800">合作伙伴</h1></header><section className="bg-[#7189a1] px-5 py-7 text-white"><BriefcaseBusiness size={26}/><h2 className="mt-3 text-xl font-bold">把优势变成合作机会</h2><p className="mt-2 text-sm text-white/75">留下真实信息，审核后由平台与你联系</p></section><div className="space-y-3 p-4">
 <section className="overflow-hidden rounded-3xl bg-white px-4 shadow-sm"><label className="flex items-center gap-3 border-b border-slate-100 py-4"><UserRound size={18} className="text-[#7189a1]"/><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="联系人姓名（必填）" className="flex-1 text-sm outline-none"/></label><label className="flex items-center gap-3 py-4"><BriefcaseBusiness size={18} className="text-[#7189a1]"/><input value={form.organization} onChange={e=>setForm({...form,organization:e.target.value})} placeholder="公司 / 团队名称（可选）" className="flex-1 text-sm outline-none"/></label></section>
 <section className="rounded-3xl bg-white p-4 shadow-sm"><b className="text-sm text-slate-800">你的资源与优势</b><textarea value={form.advantages} onChange={e=>setForm({...form,advantages:e.target.value.slice(0,300)})} placeholder="请介绍可提供的资源、合作方向、所在地区等（至少10个字）" className="mt-3 h-28 w-full resize-none rounded-2xl bg-slate-50 p-3 text-sm outline-none"/><p className="mt-1 text-right text-[10px] text-slate-400">{form.advantages.length}/300</p></section>
 <section className="rounded-3xl bg-white p-4 shadow-sm"><b className="text-sm text-slate-800">联系方式</b><p className="mt-1 text-[11px] text-slate-400">至少填写一种，填写越多越方便联系</p><div className="mt-3 space-y-2">{channels.map((c,i)=>{const Icon=i===0?Phone:i===1?Mail:MessageCircle;return <label key={c} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3"><Icon size={17} className="text-slate-400"/><span className="w-24 text-xs text-slate-600">{c}</span><input value={form.channels[c]||""} onChange={e=>setForm({...form,channels:{...form.channels,[c]:e.target.value}})} placeholder="请输入" className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></label>})}</div></section>
 {error&&<p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}<button type="button" disabled={submitting} onClick={submit} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7189a1] py-4 text-sm font-bold text-white disabled:opacity-60"><Send size={18}/>{submitting?"正在提交…":"提交合作意向"}</button>
 </div></main>;
}
