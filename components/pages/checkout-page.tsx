"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  PackageOpen,
  MapPin,
  MessageCircle,
  WalletCards,
} from "lucide-react";
import { formatMoney } from "../../lib/data";

export function CheckoutPage({
  total,
  onBack,
}: {
  total: number;
  onBack: () => void;
}) {
  const [payment, setPayment] = useState("微信支付");
  const [paid, setPaid] = useState(false);

  const hasItems = total > 0;
  const shipping = hasItems && total < 99 ? 6 : 0;
  const discount = hasItems && total >= 100 ? 10 : 0;
  const payable = total + shipping - discount;

  const payments = [
    { name: "微信支付", icon: MessageCircle, tone: "text-[#6d927b]" },
    { name: "支付宝", icon: WalletCards, tone: "text-[#7189a1]" },
    { name: "卡兔余额", icon: CreditCard, tone: "text-[#ba866f]" },
  ];

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
        <h1 className="text-[17px] font-bold text-slate-800">确认订单</h1>
        <span className="size-9" />
      </header>

      <section className="space-y-3 px-4">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-[#e7eef2] text-[#7189a1]">
            <MapPin size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-slate-700">
              暂无收货地址
            </span>
            <p className="mt-1 truncate text-xs text-slate-400">
              请先添加收货地址
            </p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">商品清单</h2>
          <div className="mt-4 flex flex-col items-center rounded-xl bg-[#f7f9fa] px-4 py-8 text-center">
            <PackageOpen size={28} className="text-slate-300" strokeWidth={1.4} />
            <p className="mt-2 text-xs text-slate-400">
              {hasItems ? "商品信息待加载" : "暂无待结算商品"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">费用明细</h2>
          <div className="mt-4 space-y-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>商品总计</span>
              <span>{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>运费</span>
              <span>{shipping === 0 ? "免运费" : formatMoney(shipping)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>优惠扣减</span>
              <span className="text-[#df7066]">-{formatMoney(discount)}</span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">支付方式</h2>
          <div className="mt-2">
            {payments.map(({ name, icon: Icon, tone }, index) => (
              <button
                type="button"
                key={name}
                onClick={() => setPayment(name)}
                className={`flex w-full items-center gap-3 py-3.5 text-left ${
                  index !== payments.length - 1 ? "border-b border-slate-100" : ""
                }`}
              >
                <Icon size={21} className={tone} />
                <span className="flex-1 text-sm text-slate-700">{name}</span>
                <span className={`flex size-5 items-center justify-center rounded-full border ${payment === name ? "border-[#7189a1] bg-[#7189a1] text-white" : "border-slate-300"}`}>
                  {payment === name && <Check size={12} />}
                </span>
              </button>
            ))}
          </div>
        </section>
      </section>

      <div className="fixed bottom-0 left-1/2 z-40 flex h-[72px] w-full max-w-[390px] -translate-x-1/2 items-center gap-3 border-t border-slate-100 bg-white/95 px-4 shadow-[0_-6px_22px_rgba(90,105,120,0.1)] backdrop-blur">
        <div className="min-w-0 flex-1">
          <span className="block text-[10px] text-slate-400">实付款</span>
          <span className="text-xl font-bold text-[#df7066]">
            {formatMoney(payable)}
          </span>
        </div>
        <button
          type="button"
          disabled={paid || !hasItems}
          onClick={() => setPaid(true)}
          className="h-11 rounded-full bg-[#7189a1] px-7 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {paid ? "支付成功" : hasItems ? "立即支付" : "暂无订单"}
        </button>
      </div>
    </main>
  );
}
