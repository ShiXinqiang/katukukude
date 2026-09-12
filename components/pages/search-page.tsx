"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronDown,
  Filter,
  Search,
  X,
} from "lucide-react";
import { catalogProducts, formatMoney } from "../../lib/data";
import { SkeletonImage } from "../ui";

export function SearchResultsPage({
  initialKeyword,
  onBack,
  onProduct,
}: {
  initialKeyword: string;
  onBack: () => void;
  onProduct: (id: string) => void;
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const normalized = keyword.trim().toLowerCase();

  const matched = catalogProducts.filter((product) => {
    const haystack = [
      product.title,
      product.subtitle,
      product.store,
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });

  const results = matched;

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6f8] pb-28">
      <header className="px-4 pb-2 pt-9">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
          >
            <ArrowLeft size={19} />
          </button>

          <form
            className="flex min-w-0 flex-1 items-center rounded-full bg-white px-3 py-2.5 shadow-sm"
            onSubmit={(event) => event.preventDefault()}
          >
            <Search size={17} className="mr-2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword("")}
                className="text-slate-300"
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <button type="button" className="flex items-center gap-1 font-medium">
            综合
            <ChevronDown size={14} />
          </button>
          <button type="button">销量</button>
          <button type="button" className="flex items-center gap-1">
            价格
            <ArrowUpDown size={14} />
          </button>
          <button type="button" className="flex items-center gap-1">
            <Filter size={14} />
            筛选
          </button>
        </div>
      </header>

      {results.length === 0 ? (
        <section className="mx-4 mt-24 flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          <span className="flex size-20 items-center justify-center rounded-full bg-[#edf1f3] text-[#8195a7]">
            <Search size={36} strokeWidth={1.4} />
          </span>
          <h2 className="mt-5 text-base font-semibold text-slate-700">
            暂无搜索结果
          </h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            没有找到与“{keyword || "当前关键词"}”相关的商品
            <br />
            换个关键词试试吧
          </p>
        </section>
      ) : (
        <section className="mt-4 space-y-3 px-4">
          {results.map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => onProduct(product.id)}
              className="flex w-full gap-3 rounded-2xl bg-white p-2.5 text-left shadow-sm"
            >
              <SkeletonImage
                className="h-28 w-28 shrink-0 rounded-xl"
                label={product.imageLabel}
              />
              <span className="min-w-0 flex-1 py-1">
                <span className="line-clamp-2 block text-sm font-semibold leading-5 text-slate-800">
                  {product.title}
                </span>
                <span className="mt-2 flex flex-wrap gap-1">
                  <span className="rounded bg-[#f5e8e1] px-1.5 py-0.5 text-[10px] text-[#bd806e]">
                    好评
                  </span>
                  <span className="rounded bg-[#f1f4f5] px-1.5 py-0.5 text-[10px] text-slate-500">
                    {product.tags[0]}
                  </span>
                </span>
                <span className="mt-3 flex items-end justify-between">
                  <span>
                    <span className="text-lg font-bold text-[#df7066]">
                      {formatMoney(product.price)}
                    </span>
                    <span className="ml-1.5 text-[10px] text-slate-400 line-through">
                      {formatMoney(product.original)}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    月销 {product.sales}
                  </span>
                </span>
              </span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}
