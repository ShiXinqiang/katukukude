"use client";

import { useEffect, useRef, useState } from "react";
import {
  Clipboard,
  ExternalLink,
  LocateFixed,
  Loader2,
  MapPin,
  X,
} from "lucide-react";

export type LocationPickerResult = {
  label: string;
  detail: string;
  mapLink: string;
  latitude: string;
  longitude: string;
};

type ReverseResponse = {
  label?: string;
  detail?: string;
};

type ResolveResponse = {
  latitude?: number;
  longitude?: number;
  mapLink?: string;
  message?: string;
};

type LocationPickerProps = {
  title?: string;
  description?: string;
  initialLink?: string;
  onClose: () => void;
  onApply: (result: LocationPickerResult) => void;
};

function createMapLink(latitude: number, longitude: number) {
  return "https://www.google.com/maps/search/?api=1&query=" + latitude + "," + longitude;
}

function requestPosition(): Promise<GeolocationPosition> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("当前浏览器不支持自动定位"));
  }

  return new Promise((resolve, reject) => {
    let retried = false;
    const retryWithNetworkLocation = () => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 300000,
      });
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => {
        if (
          !retried &&
          (error.code === error.TIMEOUT ||
            error.code === error.POSITION_UNAVAILABLE)
        ) {
          retried = true;
          retryWithNetworkLocation();
          return;
        }
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 120000,
      },
    );
  });
}

function getLocationErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? Number((error as { code?: unknown }).code)
      : 0;

  if (code === 1) {
    return "位置权限被拒绝。请在浏览器设置中允许卡兔使用位置，再重试。";
  }
  if (code === 2) {
    return "暂时无法确定位置。请打开手机定位和网络后重试，也可以粘贴 Google 地图链接。";
  }
  if (code === 3) {
    return "获取位置超时。请保持网络畅通后重试，也可以粘贴 Google 地图链接。";
  }
  return error instanceof Error
    ? error.message
    : "自动定位失败，请粘贴 Google 地图链接。";
}

async function reverseLocation(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  const response = await fetch("/api/location/reverse?" + params.toString(), {
    cache: "no-store",
  });
  if (!response.ok) return {} as ReverseResponse;
  return (await response.json()) as ReverseResponse;
}

export function LocationPicker({
  title = "选择地图位置",
  description = "自动定位失败时，可以从 Google 地图复制位置链接回来填写。",
  initialLink = "",
  onClose,
  onApply,
}: LocationPickerProps) {
  const [link, setLink] = useState(initialLink);
  const [locating, setLocating] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [message, setMessage] = useState("");
  const [mapsOpened, setMapsOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const useCurrentLocation = async () => {
    setLocating(true);
    setMessage("正在获取当前位置，请允许浏览器的位置权限…");

    try {
      const position = await requestPosition();
      const latitude = Number(position.coords.latitude.toFixed(7));
      const longitude = Number(position.coords.longitude.toFixed(7));
      let reverse: ReverseResponse = {};

      try {
        reverse = await reverseLocation(latitude, longitude);
      } catch {
        reverse = {};
      }

      const fallback =
        "当前位置 · " +
        latitude.toFixed(5) +
        " · " +
        longitude.toFixed(5);

      onApply({
        label: reverse.label || fallback,
        detail: reverse.detail || fallback,
        mapLink: createMapLink(latitude, longitude),
        latitude: String(latitude),
        longitude: String(longitude),
      });
    } catch (error) {
      setMessage(getLocationErrorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  const resolveManualLink = async (linkValue = link) => {
    const value = linkValue.trim();
    if (!value) {
      setMessage("请先粘贴 Google 地图分享链接。");
      inputRef.current?.focus();
      return;
    }

    setResolving(true);
    setMessage("正在读取地图链接并识别地址…");

    try {
      const response = await fetch(
        "/api/location/resolve?url=" + encodeURIComponent(value),
        { cache: "no-store" },
      );
      const resolved = (await response.json()) as ResolveResponse;
      if (
        !response.ok ||
        !Number.isFinite(resolved.latitude) ||
        !Number.isFinite(resolved.longitude)
      ) {
        throw new Error(
          resolved.message ||
            "无法从链接中读取位置，请重新复制 Google 地图分享链接。",
        );
      }

      const latitude = Number(resolved.latitude);
      const longitude = Number(resolved.longitude);
      let reverse: ReverseResponse = {};

      try {
        reverse = await reverseLocation(latitude, longitude);
      } catch {
        reverse = {};
      }

      const fallback =
        "已选择地图位置 · " +
        latitude.toFixed(5) +
        " · " +
        longitude.toFixed(5);

      onApply({
        label: reverse.label || fallback,
        detail: reverse.detail || fallback,
        mapLink: resolved.mapLink || createMapLink(latitude, longitude),
        latitude: String(latitude),
        longitude: String(longitude),
      });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "地图链接读取失败，请重新复制后粘贴。",
      );
    } finally {
      setResolving(false);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard?.readText) throw new Error("clipboard_unavailable");
      const value = await navigator.clipboard.readText();
      if (!value.trim()) throw new Error("clipboard_empty");
      setLink(value.trim());
      setMessage("链接已粘贴，请点击“解析位置”。");
    } catch {
      setMessage("请长按输入框，选择“粘贴”放入 Google 地图链接。");
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    if (!mapsOpened) return;

    const handleVisibility = () => {
      if (document.visibilityState !== "visible" || locating || resolving) return;
      const clipboard = navigator.clipboard;
      if (!clipboard) return;
      void clipboard.readText().then((value) => {
        const copied = value.trim();
        if (
          !copied ||
          copied === link ||
          !/(maps\.app\.goo\.gl|goo\.gl|google\.[^/\s]+\/maps)/i.test(copied)
        ) {
          return;
        }
        setLink(copied);
        setMessage("检测到刚刚复制的地图链接，正在自动解析…");
        void resolveManualLink(copied);
      }).catch(() => undefined);
    };;

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [link, locating, mapsOpened, resolving]);

  const openGoogleMaps = () => {
    const opened = window.open(
      "https://www.google.com/maps",
      "_blank",
      "noopener,noreferrer",
    );
    setMapsOpened(true);
    setMessage(
      opened === null
        ? "浏览器阻止了新页面，请允许打开新窗口后重试。"
        : "选好位置后请在地图里点“分享 / 复制”，再返回卡兔；卡兔会自动读取并解析链接。",
    );
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 px-3 pb-3"
      onClick={onClose}
    >
      <section
        className="w-full max-w-[366px] rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8eef2] text-[#667f98]">
              <MapPin size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">
                {description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
          >
            <X size={16} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void useCurrentLocation()}
          disabled={locating || resolving}
          className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-[#7189a1] p-4 text-left text-white disabled:opacity-60"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-white/15">
            {locating ? (
              <Loader2 size={19} className="animate-spin" />
            ) : (
              <LocateFixed size={19} />
            )}
          </span>
          <span>
            <b className="block text-sm">
              {locating ? "正在获取当前位置…" : "授权定位并自动填写"}
            </b>
            <span className="mt-1 block text-[11px] text-white/70">
              定位失败会自动尝试网络位置
            </span>
          </span>
        </button>

        <div className="mt-3 rounded-2xl border border-slate-100 bg-[#f8fafb] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">
              手动粘贴地图分享链接
            </span>
            <button
              type="button"
              onClick={() => void pasteFromClipboard()}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#667f98]"
            >
              <Clipboard size={14} />
              粘贴
            </button>
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void resolveManualLink();
            }}
          >
            <input
              ref={inputRef}
              value={link}
              onChange={(event) => setLink(event.target.value)}
              placeholder="粘贴 maps.app.goo.gl 链接"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-xl bg-white px-3 py-3 text-xs text-slate-700 outline-none ring-1 ring-slate-100 placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={locating || resolving}
              className="shrink-0 rounded-xl bg-[#e8eef2] px-3 text-xs font-semibold text-[#667f98] disabled:opacity-50"
            >
              {resolving ? "读取中" : "解析位置"}
            </button>
          </form>
          <p className="mt-2 text-[10px] leading-4 text-slate-400">
            打开地图后点击准确位置，再点“分享 / 复制”。返回卡兔后会自动读取；如果系统不允许，请长按输入框粘贴。
          </p>
          <button
            type="button"
            onClick={openGoogleMaps}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-xs font-semibold text-slate-600"
          >
            <ExternalLink size={15} />
            打开 Google Maps 选点
          </button>
        </div>

        {message && (
          <p className="mt-3 rounded-xl bg-[#edf3f6] px-3 py-2.5 text-center text-[11px] leading-5 text-[#607d96]">
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full py-2 text-xs text-slate-400"
        >
          返回当前页面
        </button>
      </section>
    </div>
  );
}
