
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronDown, MapPin, Search, ShoppingCart,
  Star, Store, UsersRound, Navigation, X
} from "lucide-react";
import type { AuthUser, View } from "../../lib/data";
import { catalogProducts, formatMoney, services } from "../../lib/data";
import { readRegion, saveRegion } from "../../lib/local-profile";
import { SectionHeader, SkeletonImage } from "../ui";

const regions = ["仰光 Yangon", "曼德勒 Mandalay", "内比都 Naypyidaw", "掸邦 Shan", "克钦邦 Kachin", "若开邦 Rakhine"];

export function HomePage({ onNavigate, onProduct, onSearch, onService, cartCount, user }: {
  onNavigate: (view: View) => void;
  onProduct: (id: string) => void;
  onSearch: (keyword: string) => void;
  onService: (name: string) => void;
  cartCount: number;
  user: AuthUser | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [region, setRegion] = useState("仰光 Yangon");
  const [regionOpen, setRegionOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setRegion(readRegion()), []);

  const beginSearch = () => {
    setSearching(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const closeSearch = () => {
    inputRef.current?.blur();
    setSearching(false);
    setKeyword("");
  };
  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    if (keyword.trim()) onSearch(keyword.trim());
  };
  const chooseRegion = (value: string) => {
    setRegion(value); saveRegion(value); setRegionOpen(false);
  };
  const autoLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        chooseRegion(`当前位置 · ${coords.latitude.toFixed(3)}, ${coords.longitude.toFixed(3)}`);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };
  const clickService = (name: string) => {
    if (name === "到家") return onNavigate("homeRoute");
    if (name === "好物") return onService(name);
    onService(name);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f9] pb-28">
      <header className="sticky top-0 z-30 border-b border-slate-100/80 bg-[#f5f7f9]/95 px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex h-11 items-center gap-2">
          <div className={`overflow-hidden transition-all duration-300 ${searching ? "w-0 opacity-0" : "w-[132px] opacity-100"}`}>
            <button type="button" onClick={() => setRegionOpen(true)}
              className="flex h-10 w-[132px] items-center gap-1 overflow-hidden text-left text-xs font-semibold text-slate-700">
              <MapPin size={17} className="shrink-0 text-[#6f879d]" />
              <span className="truncate">{region}</span><ChevronDown size={14} className="shrink-0 text-slate-400" />
            </button>
          </div>
          {searching && (
            <button type="button" onClick={closeSearch} aria-label="返回" className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-600">
              <ArrowLeft size={21} />
            </button>
          )}
          <form onSubmit={submitSearch} onClick={beginSearch}
            className="flex h-10 min-w-0 flex-1 items-center rounded-full border border-slate-100 bg-white px-3 shadow-sm transition-all">
            <Search size={17} className="mr-2 shrink-0 text-slate-400" />
            <input ref={inputRef} value={keyword} onFocus={beginSearch} onChange={e => setKeyword(e.target.value)}
              placeholder="搜美食、商品或服务" className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
            {searching && keyword && <button type="button" aria-label="清空" onClick={e => {e.stopPropagation();setKeyword("");inputRef.current?.focus();}} className="text-slate-400"><X size={17}/></button>}
          </form>
          {!searching && (
            <button type="button" onClick={() => onNavigate("cart")} aria-label="购物车"
              className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
              <ShoppingCart size={19} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-[#d96f68] px-1.5 text-[9px] text-white">{cartCount}</span>}
            </button>
          )}
        </div>
      </header>

      <section className="px-4 pt-5">
        <div className="grid grid-cols-5 gap-y-5 rounded-3xl bg-white px-2 py-5 shadow-[0_8px_28px_rgba(80,98,116,.06)]">
          {services.map(({ name, icon: Icon, tone }) => (
            <button type="button" key={name} onClick={() => clickService(name)}
              className="group flex flex-col items-center gap-2 text-[12px] font-medium text-slate-600 active:scale-95">
              <span className={`flex size-12 items-center justify-center rounded-2xl transition group-active:scale-95 ${tone}`}>
                <Icon size={23} strokeWidth={1.8} />
              </span><span>{name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={`mt-4 grid gap-3 px-4 ${user?.role === "user" || !user ? "grid-cols-2" : "grid-cols-1"}`}>
        {(!user || user.role === "user") && (
          <button type="button" onClick={() => onNavigate("merchantApply")}
            className="relative min-h-[116px] overflow-hidden rounded-3xl bg-[#e7eef3] p-4 text-left active:scale-[.98]">
            <div className="absolute -right-5 -top-5 size-24 rounded-full bg-white/45" />
            <Store size={23} className="relative text-[#647f98]" />
            <p className="relative mt-3 text-[15px] font-bold text-slate-800">商家入驻</p>
            <p className="relative mt-1 text-[11px] text-slate-500">提交资料 · 平台审核</p>
            <ArrowRight size={16} className="absolute bottom-4 right-4 text-[#7890a6]" />
          </button>
        )}
        <button type="button" onClick={() => onNavigate("partner")}
          className="relative min-h-[116px] overflow-hidden rounded-3xl bg-[#f3eae3] p-4 text-left active:scale-[.98]">
          <div className="absolute -bottom-7 -right-3 size-24 rounded-full bg-white/45" />
          <UsersRound size={23} className="relative text-[#ad806a]" />
          <p className="relative mt-3 text-[15px] font-bold text-slate-800">合作伙伴</p>
          <p className="relative mt-1 text-[11px] text-slate-500">资源合作 · 共创机会</p>
          <ArrowRight size={16} className="absolute bottom-4 right-4 text-[#ad806a]" />
        </button>
      </section>

      <section className="mt-7">
        <div className="px-4"><SectionHeader title="热门推荐" onViewAll={() => onSearch("热门")} /></div>
        <div className="scrollbar-hidden flex snap-x gap-3 overflow-x-auto px-4 pb-2">
          {catalogProducts.slice(0,4).map(product => (
            <button type="button" key={product.id} onClick={() => onProduct(product.id)}
              className="min-w-[238px] snap-start overflow-hidden rounded-3xl bg-white text-left shadow-sm">
              <SkeletonImage className="h-36 rounded-none" label={product.imageLabel} />
              <div className="p-3.5">
                <h3 className="truncate text-sm font-semibold text-slate-800">{product.title}</h3>
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-lg font-bold text-[#d96f68]">{formatMoney(product.price)}</span>
                  <span className="flex items-center gap-1 text-xs text-[#b48450]"><Star size={12} fill="currentColor"/>{product.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionHeader title="猜你喜欢" onViewAll={() => onSearch("好物")} />
        <div className="space-y-3">
          {catalogProducts.map(product => (
            <button type="button" key={product.id} onClick={() => onProduct(product.id)}
              className="flex w-full gap-3 rounded-3xl bg-white p-2.5 text-left shadow-sm active:scale-[.99]">
              <SkeletonImage className="h-[108px] w-[112px] shrink-0 rounded-2xl" label={product.imageLabel}/>
              <span className="min-w-0 flex-1 py-1">
                <span className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">{product.title}</span>
                <span className="mt-2 flex gap-1">{product.tags.map(t=><span key={t} className="rounded-md bg-[#f0f3f5] px-1.5 py-1 text-[10px] text-slate-500">{t}</span>)}</span>
                <span className="mt-2 flex items-end justify-between">
                  <span><b className="text-lg text-[#d96f68]">{formatMoney(product.price)}</b><s className="ml-2 text-[10px] text-slate-400">{formatMoney(product.original)}</s></span>
                  <span className="text-[10px] text-slate-400">{product.distance}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {regionOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35" onClick={() => setRegionOpen(false)}>
          <section onClick={e=>e.stopPropagation()} className="w-full max-w-[390px] rounded-t-[28px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-200"/>
            <div className="mt-5 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-800">选择地区</h2><button type="button" aria-label="关闭" onClick={()=>setRegionOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-slate-100"><X size={18}/></button></div>
            <button type="button" onClick={autoLocate} disabled={locating} className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-[#edf3f6] p-4 text-left text-[#607d96]">
              <span className="flex size-10 items-center justify-center rounded-full bg-white"><Navigation size={19}/></span>
              <span><b className="block text-sm">{locating ? "正在获取位置…" : "自动获取当前位置"}</b><span className="mt-1 block text-[11px] text-slate-500">允许定位后自动选择附近地区</span></span>
            </button>
            <div className="mt-4 grid grid-cols-2 gap-2">{regions.map(item=><button type="button" key={item} onClick={()=>chooseRegion(item)} className={`rounded-xl border px-3 py-3 text-sm ${region===item?"border-[#7189a1] bg-[#edf2f5] text-[#607a92]":"border-slate-100 text-slate-600"}`}>{item}</button>)}</div>
            <a href="https://www.google.com/maps" target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"><MapPin size={17}/>在 Google 地图中选择</a>
          </section>
        </div>
      )}
    </main>
  );
}
