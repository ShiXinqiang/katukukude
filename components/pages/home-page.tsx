"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MapPin,
  Search,
  ShoppingCart,
  Star,
  Store,
  UsersRound,
} from "lucide-react";
import type { View } from "../../lib/data";
import {
  catalogProducts,
  formatMoney,
  services,
} from "../../lib/data";
import { SectionHeader, SkeletonImage } from "../ui";

export function HomePage({
  onNavigate,
  onProduct,
  onSearch,
  cartCount,
}: {
  onNavigate: (view: View) => void;
  onProduct: (id: string) => void;
  onSearch: (keyword: string) => void;
  cartCount: number;
}) {
  const [keyword, setKeyword] = useState("");

  return (
    <main className="min-h-screen overflow-hidden pb-28">
      <div className="px-4 pb-2 pt-5">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-700"
          >
            <MapPin size={17} className="text-[#7189a1]" />
            <span>上海市浦东新区</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <form
            className="flex min-w-0 flex-1 items-center rounded-full bg-white px-3 py-2.5 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(keyword.trim() || "好物");
            }}
          >
            <Search size={17} className="mr-2 shrink-0 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜美食、商品或服务"
              className="min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
            />
          </form>

          <button
            type="button"
            onClick={() => onNavigate("cart")}
            aria-label="购物车"
            className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
          >
            <ShoppingCart size={18} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[#e4776c] text-[9px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <section className="mt-5 px-4">
        <div className="grid grid-cols-5 gap-y-5">
          {services.map(({ name, icon: Icon, tone }) => (
            <button
              type="button"
              key={name}
              onClick={() => name === "好物" && onSearch("好物")}
              className="flex flex-col items-center gap-1.5 text-xs text-slate-600"
            >
              <span
                className={`flex size-12 items-center justify-center rounded-full ${tone}`}
              >
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span>{name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7 grid grid-cols-2 gap-3 px-4">
        <button
          type="button"
          onClick={() => onNavigate("publish")}
          className="relative overflow-hidden rounded-2xl bg-[#e8eef2] p-4 text-left"
        >
          <div className="absolute -right-4 -top-5 size-20 rounded-full bg-white/45" />
          <Store size={22} className="relative text-[#6d879e]" />
          <p className="relative mt-3 text-sm font-bold text-slate-700">
            商家入驻
          </p>
          <p className="relative mt-1 text-[10px] text-slate-500">
            开启你的生意
          </p>
          <ArrowRight
            size={16}
            className="absolute bottom-4 right-4 text-[#7890a6]"
          />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("discover")}
          className="relative overflow-hidden rounded-2xl bg-[#f3e9e0] p-4 text-left"
        >
          <div className="absolute -bottom-7 -right-3 size-20 rounded-full bg-white/45" />
          <UsersRound size={22} className="relative text-[#b38368]" />
          <p className="relative mt-3 text-sm font-bold text-slate-700">
            合作伙伴
          </p>
          <p className="relative mt-1 text-[10px] text-slate-500">
            一起发现更多
          </p>
          <ArrowRight
            size={16}
            className="absolute bottom-4 right-4 text-[#b38368]"
          />
        </button>
      </section>

      <section className="mt-7">
        <div className="px-4">
          <SectionHeader
            title="热门推荐"
            onViewAll={() => onSearch("美食")}
          />
        </div>

        <div className="scrollbar-hidden flex gap-3 overflow-x-auto px-4 pb-1">
          {(["hotpot", "coffee", "brunch"] as const).map((id) => {
            const product = catalogProducts.find((item) => item.id === id)!;

            return (
              <article
                key={product.id}
                className="min-w-[236px] snap-start overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => onProduct(product.id)}
                  className="block w-full text-left"
                >
                  <SkeletonImage
                    className="h-32 rounded-none"
                    label={product.imageLabel}
                  />
                  <div className="p-3">
                    <h3 className="truncate text-sm font-semibold text-slate-800">
                      {product.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-lg font-bold text-[#df7066]">
                          {formatMoney(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatMoney(product.original)}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs text-[#c58d52]">
                        <Star size={12} fill="currentColor" />
                        {product.rating}
                      </span>
                    </div>
                  </div>
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-7 px-4">
        <SectionHeader title="猜你喜欢" onViewAll={() => onSearch("好物")} />

        <div className="space-y-3">
          {catalogProducts.slice(2).map((product) => (
            <article
              key={product.id}
              className="flex gap-3 rounded-2xl bg-white p-2.5 shadow-sm"
            >
              <button
                type="button"
                onClick={() => onProduct(product.id)}
                className="shrink-0 text-left"
              >
                <SkeletonImage
                  className="h-[104px] w-[108px] rounded-xl"
                  label={product.imageLabel}
                />
              </button>

              <div className="min-w-0 flex-1 py-1">
                <button
                  type="button"
                  onClick={() => onProduct(product.id)}
                  className="block w-full text-left"
                >
                  <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-800">
                    {product.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-[#f1f4f5] px-1.5 py-0.5 text-[10px] text-slate-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>

                <div className="mt-2 flex items-end justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-[#df7066]">
                      {formatMoney(product.price)}
                    </span>
                    <span className="text-[10px] text-slate-400 line-through">
                      {formatMoney(product.original)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {product.distance}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
