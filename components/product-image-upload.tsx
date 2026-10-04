"use client";
import {useState} from "react";
export function ProductImageUpload({value,onChange,onBusy}:{value:string;onChange:(v:string)=>void;onBusy:(v:boolean)=>void}){
 const[busy,setBusy]=useState(false),[error,setError]=useState("");
 const urls=value.split("\n").map(x=>x.trim()).filter(Boolean);
 return <section className="mt-4 rounded-2xl border border-slate-200 p-3"><b className="text-sm">商品图片</b><p className="mt-1 text-xs leading-5 text-slate-500">最多8张，JPG、PNG或WebP，每张不超过5MB。第一张为封面。</p><label className="mt-3 block text-sm font-medium text-slate-600">上传商品图片<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy||urls.length>=8} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2" onChange={async e=>{
 const files=Array.from(e.target.files||[]);e.target.value="";if(!files.length)return;
 if(files.length+urls.length>8){setError("最多上传8张图片");return;}
 if(files.some(f=>f.size>5*1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type))){setError("请选择5MB以内的JPG、PNG或WebP图片");return;}
 setBusy(true);onBusy(true);setError("");const next=[...urls];
 try{for(const file of files){const form=new FormData();form.append("file",file);const res=await fetch("/api/merchant/product-images",{method:"POST",body:form});const data=await res.json();if(!res.ok)throw new Error(data.message||"上传失败");next.push(data.url);onChange(next.join("\n"));}}catch(err){setError(err instanceof Error?err.message:"上传失败，请重试");}finally{setBusy(false);onBusy(false);}
 }}/></label>{busy&&<p role="status" className="mt-2 text-xs text-slate-500">正在上传图片…</p>}{error&&<p role="alert" className="mt-2 text-xs text-red-600">{error}</p>}{urls.length>0&&<div className="mt-3 grid grid-cols-4 gap-2">{urls.map((url,i)=><div key={url} className="min-w-0"><img src={url} alt={`商品图片${i+1}`} className="aspect-square w-full rounded-xl object-cover"/><button type="button" disabled={busy} onClick={()=>onChange(urls.filter((_,n)=>n!==i).join("\n"))} className="mt-1 w-full py-2 text-xs text-slate-500">移除{i+1}</button></div>)}</div>}<label className="mt-3 block text-xs text-slate-500">或填写HTTPS图片地址（每行一个）<textarea rows={2} disabled={busy} value={value} onChange={e=>onChange(e.target.value)} className="mt-1 w-full rounded-xl bg-slate-50 p-3 text-sm"/></label></section>
}
