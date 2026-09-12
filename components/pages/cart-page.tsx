"use client";

import { useRef, useState, type TouchEvent } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  ShoppingCart,
  Store,
} from "lucide-react";
import type { CartItem } from "../../lib/data";
import { formatMoney, initialCartItems } from "../../lib/data";
import { SkeletonImage } from "../ui";

function SwipeCartRow({
  item,
  selected,
  onToggle,
  onDelete,
  onChangeQuantity,
}: {
  item: CartItem;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onChangeQuantity: (delta: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    startX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (startX.current === null) return;
    const endX = event.changedTouches[0]?.clientX ?? startX.current;
    const delta = startX.current - endX;

    if (delta > 35) setOpen(true);
    if (delta < -35) setOpen(false);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden bg-white">
      <button
        type="button"
        onClick={onDelete}
        className="absolute inset-y-0 right-0 flex w-[72px] items-center justify-center bg-[#df7066] text-xs font-medium text-white"
      >
        删除
      </button>

      <div
        className="relative flex gap-2.5 bg-white px-3.5 py-3 transition-transform duration-200"
        style={{ transform: open ? "translateX(-72px)" : "translateX(0)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-5 size-4 accent-[#7189a1]"
        />

        <SkeletonImage
          className="h-[76px] w-[76px] shrink-0 rounded-xl"
          label={item.imageLabel}
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-slate-800">
            {item.title}
          </h3>
          <p className="mt-1 truncate text-[11px] text-slate-400">
            {item.spec}
          </p>

          <div className="mt-3 flex items-end justify-between">
            <span className="text-base font-bold text-[#df7066]">
              {formatMoney(item.unit)}
            </span>

            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onChangeQuantity(-1)}
                className="flex size-7 items-center justify-center text-slate-500"
              >
                <Minus size={13} />
              </button>
              <span className="flex h-7 w-7 items-center justify-center border-x border-slate-200 text-xs">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onChangeQuantity(1)}
                className="flex size-7 items-center justify-center text-slate-500"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartPage({
  onBack,
  onCheckout,
}: {
  onBack: () => void;
  onCheckout: (total: number) => void;
}) {
  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialCartItems.map((item) => item.id),
  );
  const [managing, setManaging] = useState(false);

  const shops = Array.from(new Set(items.map((item) => item.shop)));
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const selectedCount = selectedItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const total = selectedItems.reduce(
    (sum, item) => sum + item.unit * item.quantity,
    0,
  );
  const allSelected = items.length > 0 && selectedIds.length === items.length;

  const toggleItem = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id],
    );
  };

  const changeQuantity = (id: string, delta: number) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  };

  const deleteItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    setSelectedIds((current) => current.filter((itemId) => itemId !== id));
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f6f8] pb-28">
      <header className="flex items-center justify-between px-4 pb-3 pt-9">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex size-9 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
        >
          <ArrowLeft size={19} />
        </button>
        <h1 className="text-[17px] font-bold text-slate-800">购物车</h1>
        <button
          type="button"
          onClick={() => setManaging((value) => !value)}
          className="text-sm text-slate-500"
        >
          {managing ? "完成" : "管理"}
        </button>
      </header>

      {items.length === 0 ? (
        <section className="mx-4 mt-20 flex flex-col items-center rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
          <ShoppingCart size={42} className="text-slate-300" strokeWidth={1.4} />
          <h2 className="mt-4 text-base font-semibold text-slate-700">
            购物车还是空的
          </h2>
          <p className="mt-2 text-xs text-slate-400">去发现一些喜欢的商品吧</p>
        </section>
      ) : (
        <section className="space-y-3 px-4">
          {shops.map((shop) => {
            const shopItems = items.filter((item) => item.shop === shop);
            const shopSelected = shopItems.every((item) =>
              selectedIds.includes(item.id),
            );

            return (
              <div key={shop} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="flex items-center gap-2 px-3.5 py-3">
                  <input
                    type="checkbox"
                    checked={shopSelected}
                    onChange={() => {
                      setSelectedIds((current) =>
                        shopSelected
                          ? current.filter(
                              (id) => !shopItems.some((item) => item.id === id),
                            )
                          : Array.from(
                              new Set([
                                ...current,
                                ...shopItems.map((item) => item.id),
                              ]),
                            ),
                      );
                    }}
                    className="size-4 accent-[#7189a1]"
                  />
                  <Store size={16} className="text-[#7189a1]" />
                  <span className="flex-1 text-sm font-semibold text-slate-700">
                    {shop}
                  </span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>

                {shopItems.map((item) => (
                  <SwipeCartRow
                    key={item.id}
                    item={item}
                    selected={selectedIds.includes(item.id)}
                    onToggle={() => toggleItem(item.id)}
                    onDelete={() => deleteItem(item.id)}
                    onChangeQuantity={(delta) => changeQuantity(item.id, delta)}
                  />
                ))}
              </div>
            );
          })}
          <p className="px-1 text-center text-[10px] text-slate-400">
            商品支持左滑删除
          </p>
        </section>
      )}

      <div className="fixed bottom-0 left-1/2 z-40 flex h-[72px] w-full max-w-[390px] -translate-x-1/2 items-center gap-3 border-t border-slate-100 bg-white/95 px-3 shadow-[0_-6px_22px_rgba(90,105,120,0.1)] backdrop-blur">
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              setSelectedIds(allSelected ? [] : items.map((item) => item.id))
            }
            className="size-4 accent-[#7189a1]"
          />
          全选
        </label>

        <div className="min-w-0 flex-1">
          <span className="block text-[10px] text-slate-400">合计</span>
          <span className="text-lg font-bold text-[#df7066]">
            {formatMoney(total)}
          </span>
        </div>

        <button
          type="button"
          disabled={selectedCount === 0}
          onClick={() => onCheckout(total)}
          className="h-11 shrink-0 rounded-full bg-[#7189a1] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          去结算({selectedCount})
        </button>
      </div>
    </main>
  );
}
