
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ChevronDown, MapPin, Search, ShoppingCart,
  Star, Store, UsersRound, Navigation, X
} from "lucide-react";
import type { AuthUser, View } from "../../lib/data";
import type { ProductData } from "../../lib/data";
import { formatMoney, services } from "../../lib/data";
import { readCurrentLocation, readRegion, saveCurrentLocation, saveRegion, type SavedCurrentLocation } from "../../lib/local-profile";
import { SectionHeader, SkeletonImage } from "../ui";
import { LocationPicker, type LocationPickerResult } from "../location-picker";

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
  const [currentLocation, setCurrentLocation] = useState<SavedCurrentLocation | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setRegion(readRegion()); setCurrentLocation(readCurrentLocation()); }, []);
  useEffect(() => { let active=true; fetch("/api/catalog",{cache:"no-store"}).then(r=>r.json()).then(data=>{if(active)setProducts(data.products||[])}).catch(()=>active&&setProducts([])).finally(()=>active&&setProductsLoading(false)); return()=>{active=false}; }, []);

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
  const autoLocate = () => setLocationPickerOpen(true);

  const applyLocation = (result: LocationPickerResult) => {
    const saved = { label: result.primaryLabel || result.label, detail: result.detail, mapLink: result.mapLink, latitude: result.latitude, longitude: result.longitude };
    saveCurrentLocation(saved);
    setCurrentLocation({ ...saved, updatedAt: new Date().toISOString() });
    chooseRegion(result.primaryLabel || result.label);
    setLocationPickerOpen(false);
    setRegionOpen(false);
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
          {productsLoading && [1,2].map(item => <div key={item} className="h-[210px] min-w-[238px] animate-pulse rounded-3xl bg-slate-200" />)}
          {!productsLoading && products.length === 0 && <div className="w-full rounded-3xl bg-white px-5 py-8 text-center text-sm text-slate-400">暂无已上架商品，商家发布后会显示在这里</div>}
          {products.slice(0,4).map(product => (
            <button type="button" key={product.id} onClick={() => onProduct(product.id)}
              className="min-w-[238px] snap-start overflow-hidden rounded-3xl bg-white text-left shadow-sm">
              <span className="relative block"><SkeletonImage className="h-36 rounded-none" label={product.imageLabel} />{product.badge&&<span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#b16f5f]">{product.badge}</span>}{product.isOfficial&&<span className="absolute right-3 top-3 rounded-full bg-[#6f879d]/90 px-2.5 py-1 text-[10px] font-semibold text-white">官方</span>}</span>
              <div className="p-3.5">
                <h3 className="truncate text-sm font-semibold text-slate-800">{product.title}</h3>{product.promotionTitle&&<p className="mt-1 truncate text-[11px] text-[#b47763]">{product.promotionTitle}</p>}
                <div className="mt-2 flex items-end justify-between">
                  <span className="text-lg font-bold text-[#d96f68]">{formatMoney(product.price)}</span>
                  <span className="flex items-center gap-1 text-xs text-[#b48450]"><Star size={12} fill={product.rating==="暂无"?"none":"currentColor"}/>{product.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 px-4">
        <SectionHeader title="猜你喜欢" onViewAll={() => onSearch("好物")} />
        <div className="space-y-3">
          {productsLoading && [1,2,3].map(item => <div key={item} className="h-[128px] animate-pulse rounded-3xl bg-slate-200" />)}
          {!productsLoading && products.length === 0 && <div className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-slate-400">还没有可购买的商品</div>}
          {products.map(product => (
            <button type="button" key={product.id} onClick={() => onProduct(product.id)}
              className="flex w-full gap-3 rounded-3xl bg-white p-2.5 text-left shadow-sm active:scale-[.99]">
              <SkeletonImage className="h-[108px] w-[112px] shrink-0 rounded-2xl" label={product.imageLabel}/>
              <span className="min-w-0 flex-1 py-1">
                <span className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">{product.title}</span>
                <span className="mt-2 flex flex-wrap gap-1">{product.isOfficial&&<span className="rounded-md bg-[#e8eef2] px-1.5 py-1 text-[10px] text-[#607992]">官方认证</span>}{product.promotionTitle&&<span className="rounded-md bg-[#f8eae5] px-1.5 py-1 text-[10px] text-[#b47763]">{product.promotionTitle}</span>}{product.tags.map(t=><span key={t} className="rounded-md bg-[#f0f3f5] px-1.5 py-1 text-[10px] text-slate-500">{t}</span>)}</span>
                <span className="mt-2 flex items-end justify-between">
                  <span><b className="text-lg text-[#d96f68]">{formatMoney(product.price)}</b><s className="ml-2 text-[10px] text-slate-400">{formatMoney(product.original)}</s></span>
                  <span className="text-right text-[10px] text-slate-400"><span className="block">{product.sales}</span><span>{product.distance}</span></span>
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {locationPickerOpen && <LocationPicker title="选择地区" description="自动定位失败时，可从 Google 地图复制位置链接回来填写。" onClose={() => setLocationPickerOpen(false)} onApply={applyLocation} />}

      {regionOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35" onClick={() => setRegionOpen(false)}>
          <section onClick={e=>e.stopPropagation()} className="max-h-[86vh] w-full max-w-[390px] overflow-auto rounded-t-[28px] bg-white px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto h-1 w-10 rounded-full bg-slate-200"/>
            <div className="mt-5 flex items-center justify-between"><div><h2 className="text-lg font-bold text-slate-800">当前位置</h2><p className="mt-1 text-[11px] text-slate-400">选择首页展示及附近服务区域</p></div><button type="button" aria-label="关闭" onClick={()=>setRegionOpen(false)} className="flex size-9 items-center justify-center rounded-full bg-slate-100"><X size={18}/></button></div>
            <div className="mt-4 rounded-2xl border border-[#dce6ec] bg-[#f4f8fa] p-4">
              <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[#607d96]"><Navigation size={19}/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><b className="truncate text-sm text-slate-700">{currentLocation?.label||region}</b>{currentLocation&&<span className="shrink-0 rounded-full bg-[#e4eee8] px-2 py-1 text-[9px] text-[#63806d]">已定位</span>}</div><p className="mt-1 line-clamp-3 text-[11px] leading-5 text-slate-500">{currentLocation?.detail||"尚未获取实时位置，可点击下方重新定位"}</p>{currentLocation&&<p className="mt-1 text-[10px] text-slate-400">{currentLocation.latitude}, {currentLocation.longitude}</p>}</div></div>
              <button type="button" onClick={autoLocate} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7189a1] py-3 text-xs font-semibold text-white"><Navigation size={15}/>{currentLocation?"重新定位":"获取实时位置"}</button>
            </div>
            <div className="mt-5 flex items-center gap-3"><span className="text-xs font-semibold text-slate-700">直接选择地区</span><span className="h-px flex-1 bg-slate-100"/></div>
            <div className="mt-3 grid grid-cols-2 gap-2">{regions.map(item=><button type="button" key={item} onClick={()=>chooseRegion(item)} className={`rounded-xl border px-3 py-3 text-sm ${region===item?"border-[#7189a1] bg-[#edf2f5] text-[#607a92]":"border-slate-100 text-slate-600"}`}>{item}</button>)}</div>
            <button type="button" onClick={() => setLocationPickerOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-600"><MapPin size={17}/>手动添加 Google 地图位置</button>
            <p className="mt-2 text-center text-[10px] leading-5 text-slate-400">手动添加支持粘贴 Google Maps 分享链接并自动解析详细地址</p>
          </section>
        </div>
      )}
    </main>
  );
}
