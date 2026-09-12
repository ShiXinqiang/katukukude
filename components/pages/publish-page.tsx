"use client";

import { useState } from "react";
import { ChevronRight, Upload, X } from "lucide-react";
import { SkeletonImage } from "../ui";

export function PublishPage({ onBack }: { onBack: () => void }) {
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6f8] pb-28">
      <header className="flex items-center justify-between px-4 pb-3 pt-9">
        <button
          type="button"
          onClick={onBack}
          aria-label="关闭"
          className="flex size-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
        >
          <X size={19} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-800">发布商品</h1>
        <button type="button" className="text-sm text-[#7189a1]">
          草稿箱
        </button>
      </header>

      <section className="space-y-3 px-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="grid grid-cols-4 gap-2">
            {uploaded.map((id) => (
              <div key={id} className="relative">
                <SkeletonImage className="aspect-square rounded-xl" label="商品图" />
                <button
                  type="button"
                  onClick={() =>
                    setUploaded((items) => items.filter((item) => item !== id))
                  }
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-slate-700 text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {uploaded.length < 9 && (
              <label className="relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                <Upload size={21} />
                <span className="mt-1 text-[10px]">添加图片</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={(event) => {
                    const count = event.target.files?.length ?? 0;
                    if (count > 0) {
                      setUploaded((items) => [
                        ...items,
                        ...Array.from(
                          { length: Math.min(count, 9 - items.length) },
                          (_, index) => `upload-${Date.now()}-${index}`,
                        ),
                      ]);
                    }
                  }}
                />
              </label>
            )}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            首图将作为商品封面，最多上传 9 张图片
          </p>
        </div>

        <div className="rounded-2xl bg-white px-4 py-2 shadow-sm">
          <textarea
            placeholder="请输入商品标题和描述，清晰描述商品特色和使用方式"
            className="min-h-32 w-full resize-none bg-transparent py-3 text-sm leading-6 text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <label className="flex items-center border-b border-slate-100 px-4 py-4">
            <span className="w-20 text-sm text-slate-600">价格</span>
            <span className="mr-1 text-sm text-[#df7066]">¥</span>
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              placeholder="请输入售价"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <label className="flex items-center border-b border-slate-100 px-4 py-4">
            <span className="w-20 text-sm text-slate-600">库存</span>
            <input
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              inputMode="numeric"
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-slate-400">件</span>
          </label>

          <button type="button" className="flex w-full items-center px-4 py-4 text-left">
            <span className="w-20 text-sm text-slate-600">分类</span>
            <span className="flex-1 text-sm text-slate-400">请选择分类</span>
            <ChevronRight size={17} className="text-slate-300" />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <button type="button" className="flex w-full items-center border-b border-slate-100 px-4 py-4 text-left">
            <span className="w-20 text-sm text-slate-600">运费</span>
            <span className="flex-1 text-sm text-slate-400">请选择运费</span>
            <ChevronRight size={17} className="text-slate-300" />
          </button>

          <button type="button" className="flex w-full items-center px-4 py-4 text-left">
            <span className="w-20 text-sm text-slate-600">发货地</span>
            <span className="flex-1 text-sm text-slate-400">请选择发货地</span>
            <ChevronRight size={17} className="text-slate-300" />
          </button>
        </div>
      </section>

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[390px] -translate-x-1/2 border-t border-slate-100 bg-white/95 p-3 backdrop-blur">
        <button
          type="button"
          className="h-12 w-full rounded-full bg-[#7189a1] text-sm font-semibold text-white shadow-[0_7px_18px_rgba(101,126,150,0.25)]"
        >
          立即发布
        </button>
      </div>
    </main>
  );
}
