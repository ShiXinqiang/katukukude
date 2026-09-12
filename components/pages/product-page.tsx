"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronRight,
  Headphones,
  Heart,
  MoreHorizontal,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { catalogProducts, formatMoney } from "../../lib/data";
import { SkeletonImage } from "../ui";

export function ProductPage({
  productId,
  onBack,
  onAddToCart,
  onBuy,
}: {
  productId: string;
  onBack: () => void;
  onAddToCart: (quantity: number) => void;
  onBuy: (total: number) => void;
}) {
  const product =
    catalogProducts.find((item) => item.id === productId) ??
    catalogProducts[0];

  const [activePhoto, setActivePhoto] = useState(0);
  const [selectedSpec, setSelectedSpec] = useState("双人套餐");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [added, setAdded] = useState(false);

  const photoLabels = ["商品主图", "细节展示", "包装展示"];
  const specs = ["双人套餐", "四人套餐", "单人尝鲜"];

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6f8] pb-24">
      <section className="relative">
        <SkeletonImage
          className="h-[330px] rounded-none"
          label={photoLabels[activePhoto]}
        />

        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="absolute left-4 top-10 flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="absolute right-4 top-10 flex gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur"
          >
            <MoreHorizontal size={19} />
          </button>
        </div>

        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {photoLabels.map((label, index) => (
            <button
              type="button"
              key={label}
              onClick={() => setActivePhoto(index)}
              className={`h-1.5 rounded-full transition-all ${
                activePhoto === index ? "w-5 bg-white" : "w-1.5 bg-white/55"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="space-y-3 px-4 py-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-[#df7066]">
              {formatMoney(product.price)}
            </span>
            <span className="pb-1 text-sm text-slate-400 line-through">
              {formatMoney(product.original)}
            </span>
            <span className="ml-auto rounded-full bg-[#f8e7df] px-2 py-1 text-[10px] text-[#c77d6b]">
              限时优惠
            </span>
          </div>

          <h1 className="mt-3 text-lg font-bold leading-7 text-slate-800">
            {product.title}，新鲜食材现点现做，适合周末约会与朋友聚餐
          </h1>

          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[#bd8a4e]">
              <Star size={13} fill="currentColor" />
              {product.rating}
            </span>
            <span>·</span>
            <span>已售 {product.sales}</span>
            <span>·</span>
            <span>{product.distance}</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-xs text-slate-600 shadow-sm">
          <span className="flex items-center gap-1.5">
            <Truck size={16} className="text-[#7189a1]" />
            免运费
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={16} className="text-[#7189a1]" />
            正品保障
          </span>
          <span className="flex items-center gap-1.5">
            <BadgeCheck size={16} className="text-[#7189a1]" />
            7天无理由
          </span>
        </div>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">规格选择</h2>
            <span className="text-xs text-slate-400">
              已选：{selectedSpec}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {specs.map((spec) => (
              <button
                type="button"
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className={`rounded-lg border px-3 py-2 text-xs transition ${
                  selectedSpec === spec
                    ? "border-[#7189a1] bg-[#edf2f5] font-medium text-[#627c95]"
                    : "border-slate-200 text-slate-500"
                }`}
              >
                {spec}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm text-slate-700">购买数量</span>
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                className="flex size-8 items-center justify-center text-slate-500"
              >
                <Minus size={14} />
              </button>
              <span className="flex h-8 w-9 items-center justify-center border-x border-slate-200 text-sm">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((value) => value + 1)}
                className="flex size-8 items-center justify-center text-slate-500"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">用户评价</h2>
            <span className="flex items-center gap-1 text-xs text-[#bd8a4e]">
              <Star size={13} fill="currentColor" />
              {product.rating}
              <ChevronRight size={14} className="text-slate-300" />
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <SkeletonImage className="size-8 rounded-full" compact />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-slate-700">
                  可乐不加冰
                </span>
                <span className="flex gap-0.5 text-[#c18d4f]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={10} fill="currentColor" />
                  ))}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                分量很足，味道不错，服务也很贴心，下次还会带朋友一起去。
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <SkeletonImage className="size-12 rounded-xl" label="店铺" compact />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold text-slate-800">
                {product.store}
              </h2>
              <p className="mt-1 text-[11px] text-slate-400">
                营业中 · 距离你 {product.distance}
              </p>
            </div>
            <button
              type="button"
              className="rounded-full border border-[#7189a1] px-3 py-1.5 text-xs text-[#667f99]"
            >
              进店
            </button>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">图文详情</h2>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            精选当季食材，现场制作，详情内容与活动规则请以商家页面为准。
          </p>
          <div className="mt-4 space-y-3">
            <SkeletonImage className="h-44 rounded-xl" label="详情长图" />
            <SkeletonImage className="h-64 rounded-xl" label="详情长图" />
            <SkeletonImage className="h-52 rounded-xl" label="详情长图" />
          </div>
        </section>
      </section>

      <div className="fixed bottom-0 left-1/2 z-50 flex h-[72px] w-full max-w-[390px] -translate-x-1/2 items-center gap-2 border-t border-slate-100 bg-white/95 px-3 shadow-[0_-6px_22px_rgba(90,105,120,0.1)] backdrop-blur">
        <div className="flex shrink-0 items-center gap-4 px-1">
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[10px] text-slate-500"
          >
            <Headphones size={19} />
            客服
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 text-[10px] text-slate-500"
          >
            <Store size={19} />
            店铺
          </button>
          <button
            type="button"
            onClick={() => setSaved((value) => !value)}
            className={`flex flex-col items-center gap-1 text-[10px] ${
              saved ? "text-[#df7066]" : "text-slate-500"
            }`}
          >
            <Heart size={19} fill={saved ? "currentColor" : "none"} />
            收藏
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onAddToCart(quantity);
            setAdded(true);
          }}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#edf2f5] text-xs font-semibold text-[#647e97]"
        >
          {added ? "已加入购物车" : "加入购物车"}
        </button>
        <button
          type="button"
          onClick={() => onBuy(product.price * quantity)}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#7189a1] text-xs font-semibold text-white"
        >
          立即购买
        </button>
      </div>
    </main>
  );
}
