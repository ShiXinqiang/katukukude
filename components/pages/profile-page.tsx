"use client";

import {
  CreditCard,
  Headphones,
  Heart,
  LogOut,
  MapPin,
  Package,
  Star,
  Store,
  Truck,
  UserRound,
  Bookmark,
  ChevronRight,
  Settings,
  ShieldCheck,
} from "lucide-react";
import type { AuthUser, View } from "../../lib/data";
import { IconListRow, SkeletonImage } from "../ui";

export function ProfilePage({
  onNavigate,
  onLogout,
  user,
}: {
  onNavigate: (view: View) => void;
  onLogout: () => void;
  user: AuthUser | null;
}) {
  const orders = [
    { label: "待付款", icon: CreditCard, count: 0 },
    { label: "待发货", icon: Package, count: 0 },
    { label: "配送中", icon: Truck, count: 0 },
    { label: "待评价", icon: Star, count: 0 },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef2f5] pb-28">
      <section className="relative overflow-hidden bg-[#6f86a1] px-5 pb-16 pt-9 text-white">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-10 size-44 rounded-full bg-[#536d88]/35" />

        <div className="relative flex items-start justify-between">
          <button
            type="button"
            onClick={() => !user && onNavigate("login")}
            className="flex items-center gap-3 text-left"
          >
            <SkeletonImage
              className="size-16 rounded-full border-2 border-white/55"
              compact
            />
            <span>
              <span className="block text-lg font-bold">
                {user ? user.displayName : "登录 / 注册"}
              </span>
              <span className="mt-1 block text-xs text-white/70">
                {user ? `账号：${user.username}` : "登录后享受更多权益"}
              </span>
            </span>
          </button>

          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-white/12"
          >
            <Settings size={19} />
          </button>
        </div>
      </section>

      <div className="-mt-9 space-y-3 px-4">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-slate-800">我的订单</h2>
            <button
              type="button"
              onClick={() => onNavigate("cart")}
              className="flex items-center gap-0.5 text-xs text-slate-400"
            >
              查看全部
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-5 grid grid-cols-4">
            {orders.map(({ label, icon: Icon, count }) => (
              <button
                type="button"
                key={label}
                onClick={() => onNavigate("cart")}
                className="flex flex-col items-center gap-2 text-xs text-slate-600"
              >
                <span className="relative flex size-8 items-center justify-center">
                  <Icon size={21} className="text-[#7189a1]" />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-[#df7066] text-[9px] text-white">
                      {count}
                    </span>
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Heart size={20} className="text-[#d68178]" />
            <p className="mt-3 text-xs text-slate-400">我的点赞</p>
            <p className="mt-1 text-xl font-bold text-slate-800">0</p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Bookmark size={20} className="text-[#7189a1]" />
            <p className="mt-3 text-xs text-slate-400">我的收藏</p>
            <p className="mt-1 text-xl font-bold text-slate-800">0</p>
          </div>
        </section>

        <button
          type="button"
          onClick={() => {
            if (user?.role === "merchant") {
              window.location.assign("/merchant");
            } else {
              onNavigate("merchantApply");
            }
          }}
          className="flex w-full items-center justify-between overflow-hidden rounded-2xl bg-[#e7edf1] px-4 py-4 text-left shadow-sm"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-white/70 text-[#6e879e]">
              <Store size={22} />
            </span>
            <span>
              <span className="block text-sm font-bold text-slate-700">
                {user?.role === "merchant" ? "商家后台" : "商家入驻申请"}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {user?.role === "merchant"
                  ? "管理店铺、商品与订单"
                  : "提交经营资料，审核通过后开通"}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-1 rounded-full bg-[#7189a1] px-3 py-2 text-xs font-medium text-white">
            {user?.role === "merchant" ? "进入" : "去申请"}
            <ChevronRight size={13} />
          </span>
        </button>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <IconListRow icon={MapPin} label="地址管理" />
          <IconListRow icon={Headphones} label="官方客服" />
          <IconListRow icon={UserRound} label="关于我们" divider={false} />
          {user?.role === "admin" && (
            <IconListRow
              icon={ShieldCheck}
              label="管理后台"
              onClick={() => {
                window.location.assign("/admin");
              }}
            />
          )}
          {user && (
            <IconListRow
              icon={LogOut}
              label="退出登录"
              onClick={onLogout}
              divider={false}
            />
          )}
        </section>
      </div>
    </main>
  );
}
