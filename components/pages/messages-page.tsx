"use client";

import { useEffect, useState } from "react";
import {
  BellRing,
  Inbox,
  MessageCircle,
  MoreHorizontal,
  TicketPercent,
} from "lucide-react";
import { messageTypes } from "../../lib/data";

type MessageRecord = {
  id: string;
  type: string;
  title: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

const categoryTypes = ["system", "promotion", "interaction"] as const;

function getCategoryType(type: string) {
  return categoryTypes.includes(type as (typeof categoryTypes)[number])
    ? (type as (typeof categoryTypes)[number])
    : "system";
}

function formatMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "昨天";

  return date.toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });
}

export function MessagesPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/messages", {
      cache: "no-store",
      credentials: "include",
    })
      .then(async (response) => {
        if (response.status === 401) {
          return { authenticated: false, messages: [] };
        }
        if (!response.ok) throw new Error("message_request_failed");

        return {
          authenticated: true,
          ...(await response.json()) as { messages?: MessageRecord[] },
        };
      })
      .then((result) => {
        if (!active) return;
        setAuthenticated(result.authenticated);
        setMessages(result.messages ?? []);
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(null);
        setMessages([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const unreadByType = categoryTypes.reduce<Record<string, number>>(
    (result, type) => {
      result[type] = messages.filter(
        (message) =>
          getCategoryType(message.type) === type && message.readAt === null,
      ).length;
      return result;
    },
    {},
  );

  const markRead = async (id: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === id
          ? { ...message, readAt: new Date().toISOString() }
          : message,
      ),
    );
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
  };

  return (
    <main className="min-h-screen overflow-hidden pb-28">
      <header className="px-4 pb-2 pt-7">
        <div className="flex items-center justify-between">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-800">
            消息
          </h1>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm"
          >
            <MoreHorizontal size={19} />
          </button>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-3 px-4">
        {messageTypes.map(({ title, icon: Icon, tone }, index) => {
          const type = categoryTypes[index];
          const count = unreadByType[type] ?? 0;

          return (
            <button
              type="button"
              key={title}
              className="flex flex-col items-center rounded-2xl bg-white py-4 shadow-sm"
            >
              <span className={`relative flex size-14 items-center justify-center rounded-full ${tone}`}>
                <Icon size={24} strokeWidth={1.8} />
                {count > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#df7066] text-[10px] font-semibold text-white">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className="mt-2 text-[11px] text-slate-600">{title}</span>
            </button>
          );
        })}
      </section>

      <section className="mt-6 px-4">
        {loading ? (
          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : authenticated === false ? (
          <EmptyMessages
            icon={MessageCircle}
            title="登录后查看消息"
            description="登录后可接收系统通知和订单进度"
          />
        ) : messages.length === 0 ? (
          <EmptyMessages
            icon={Inbox}
            title="暂无消息"
            description="新消息会显示在这里"
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            {messages.map((message, index) => {
              const type = getCategoryType(message.type);
              const Icon =
                type === "promotion"
                  ? TicketPercent
                  : type === "interaction"
                    ? MessageCircle
                    : BellRing;
              const tone =
                type === "promotion"
                  ? "bg-[#f5e5df] text-[#c47e6f]"
                  : type === "interaction"
                    ? "bg-[#e9e6ef] text-[#88799b]"
                    : "bg-[#e3edf3] text-[#6e879d]";

              return (
                <button
                  type="button"
                  key={message.id}
                  onClick={() => !message.readAt && markRead(message.id)}
                  className={`flex w-full items-center gap-3 px-3.5 py-4 text-left ${
                    index !== messages.length - 1
                      ? "border-b border-slate-100"
                      : ""
                  }`}
                >
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                    <Icon size={21} strokeWidth={1.8} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-semibold text-slate-800">
                        {message.title}
                      </span>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatMessageTime(message.createdAt)}
                        {!message.readAt && (
                          <i className="ml-1.5 inline-block size-1.5 rounded-full bg-[#7895b0] align-middle" />
                        )}
                      </span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-400">
                      {message.content}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyMessages({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Inbox;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white px-5 py-12 text-center shadow-sm">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#edf1f3] text-[#8195a7]">
        <Icon size={31} strokeWidth={1.4} />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-700">{title}</h2>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}
