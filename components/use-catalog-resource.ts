"use client";
import { useEffect, useState } from "react";
import type { ProductData } from "../lib/data";
type Catalog = {total?:number;page?:number;pages?:number;pageSize?:number;categories?:string[]; products?: ProductData[]; product?: ProductData | null };
const cache = new Map<string, Catalog>();
export function useCatalogResource(url: string, delay = 0) {
 const [snapshot, setSnapshot] = useState(() => ({ url, data: cache.get(url), loading: !cache.has(url), error: "" }));
 const current = snapshot.url === url ? snapshot : { url, data: cache.get(url), loading: !cache.has(url), error: "" };
 useEffect(() => {
  const controller = new AbortController();
  const cached = cache.get(url);
  setSnapshot({ url, data: cached, loading: !cached, error: "" });
  const timer = setTimeout(() => {
   fetch(url, { cache: "no-store", signal: controller.signal }).then(async response => {
    if (!response.ok) throw new Error("加载失败，请稍后重试");
    return await response.json() as Catalog;
   }).then(data => {
    if (controller.signal.aborted) return;
    cache.delete(url); cache.set(url, data);
    if (cache.size > 32) cache.delete(cache.keys().next().value!);
    setSnapshot({ url, data, loading: false, error: "" });
   }).catch(error => {
    if (!controller.signal.aborted) setSnapshot({ url, data: cached, loading: false, error: error.message || "加载失败" });
   });
  }, delay);
  return () => { clearTimeout(timer); controller.abort(); };
 }, [url, delay]);
 return current;
}
