"use client";

import { useState } from "react";
import { Compass, Heart, Search } from "lucide-react";
import { discoverPosts, discoverTabs } from "../../lib/data";
import { SkeletonImage } from "../ui";

export function DiscoverPage({
  onProduct,
}: {
  onProduct: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("关注");

  return (
    <main className="min-h-screen overflow-hidden pb-28">
      <header className="px-4 pb-2 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-800">
            发现
          </h1>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
          >
            <Search size={20} />
          </button>
        </div>

        <div className="scrollbar-hidden mt-5 flex gap-6 overflow-x-auto border-b border-slate-200">
          {discoverTabs.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative shrink-0 pb-3 text-sm transition ${
                activeTab === tab
                  ? "font-semibold text-slate-800"
                  : "text-slate-400"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[#7189a1]" />
              )}
            </button>
          ))}
        </div>
      </header>

      {discoverPosts.length === 0 ? (
        <section className="mx-4 mt-16 flex flex-col items-center rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#edf1f3] text-[#8195a7]">
            <Compass size={31} strokeWidth={1.4} />
          </span>
          <h2 className="mt-4 text-base font-semibold text-slate-700">
            暂无内容
          </h2>
          <p className="mt-2 text-xs text-slate-400">
            内容发布后会显示在这里
          </p>
        </section>
      ) : (
        <section className="mt-4 columns-2 gap-3 px-3">
          {discoverPosts.map((post) => (
          <article
            key={post.id}
            className="mb-3 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-sm"
          >
            <button
              type="button"
              onClick={() => onProduct(post.productId)}
              className="block w-full text-left"
            >
              <SkeletonImage
                className={`w-full rounded-none ${post.height}`}
                label="内容封面"
              />
              <div className="px-3 pb-2 pt-2.5">
                <h2 className="line-clamp-2 text-[13px] font-semibold leading-5 text-slate-800">
                  {post.title}
                </h2>
              </div>
            </button>

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <SkeletonImage className="size-6 shrink-0 rounded-full" compact />
                <span className="truncate text-[10px] text-slate-500">
                  {post.author}
                </span>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                <Heart size={12} />
                {post.likes}
              </span>
            </div>
          </article>
          ))}
        </section>
      )}
    </main>
  );
}
