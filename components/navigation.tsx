"use client";

import type { LucideIcon } from "lucide-react";
import { Compass, Home, MessageSquare, ScanLine, UserRound } from "lucide-react";
import type { MainTab, View } from "../lib/data";
import { cn } from "./ui";

export function BottomNav({
  activeView,
  onNavigate,
}: {
  activeView: MainTab;
  onNavigate: (view: View) => void;
}) {
  const tabs: Array<{
    view: MainTab;
    label: string;
    icon: LucideIcon;
  }> = [
    { view: "home", label: "首页", icon: Home },
    { view: "discover", label: "发现", icon: Compass },
    { view: "scan", label: "扫一扫", icon: ScanLine },
    { view: "messages", label: "信息", icon: MessageSquare },
    { view: "profile", label: "我的", icon: UserRound },
  ];

  return (
    <nav className="katu-floating-nav fixed left-1/2 z-40 flex max-w-[370px] -translate-x-1/2 items-end justify-around px-2 pb-2 pt-2">
      {tabs.map(({ view, label, icon: Icon }) => {
        const active = activeView === view;

        if (view === "scan") {
          return (
            <button
              key={view}
              type="button"
              onClick={() => onNavigate("scan")}
              className="flex min-w-[60px] flex-col items-center gap-1 text-[10px] text-slate-500"
            >
              <span className="katu-floating-button katu-primary -mt-8 flex size-[58px] items-center justify-center rounded-full border border-white/40 text-white ring-4 ring-[#fff4e9]/70 backdrop-blur-xl">
                <Icon size={25} strokeWidth={1.8} />
              </span>
              <span>扫一扫</span>
            </button>
          );
        }

        return (
          <button
            key={view}
            type="button"
            onClick={() => onNavigate(view)}
            className={cn(
              "flex min-w-[56px] flex-col items-center gap-1 text-[10px] transition",
              active ? "text-[#667f99]" : "text-slate-400",
            )}
          >
            <Icon size={21} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
