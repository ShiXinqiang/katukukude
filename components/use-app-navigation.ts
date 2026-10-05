"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { View } from "../lib/data";
import { initialRoute, nextRoute, type RouteState } from "../lib/navigation-state";
export function useAppNavigation() {
 const [route, setRoute] = useState<RouteState>(initialRoute);
 const current = useRef(route);
 const commit = (value: RouteState) => { current.current = value; setRoute(value); };
 const save = () => {
  const value = { ...current.current, scrollY: window.scrollY };
  window.history.replaceState({ ...window.history.state, katuRoute: value }, "");
 };
 useEffect(() => {
  // Start a new in-app stack; do not restore potentially stale checkout after refresh.
  window.history.replaceState({ ...window.history.state, katuRoute: initialRoute }, "");
  const old = window.history.scrollRestoration;
  window.history.scrollRestoration = "manual";
  const pop = (event: PopStateEvent) => {
   const value = event.state?.katuRoute as RouteState | undefined;
   if (value?.view) commit(value);
  };
  window.addEventListener("popstate", pop);
  return () => { window.removeEventListener("popstate", pop); window.history.scrollRestoration = old; };
 }, []);
 useLayoutEffect(() => {
  document.activeElement instanceof HTMLElement && document.activeElement.blur();
  const restore = () => window.scrollTo({ top: route.scrollY, behavior: "instant" });
  restore();
  if (route.scrollY <= Math.max(0, document.documentElement.scrollHeight - window.innerHeight)) return;
  // Cached lists normally restore immediately; wait for late data only until the user interacts.
  const observer = new ResizeObserver(() => {
   restore();
   if (document.documentElement.scrollHeight - window.innerHeight >= route.scrollY) stop();
  });
  const stop = () => { observer.disconnect(); clearTimeout(timer); window.removeEventListener("pointerdown", stop); window.removeEventListener("wheel", stop); };
  const timer = setTimeout(stop, 3000);
  observer.observe(document.body);
  window.addEventListener("pointerdown", stop, { once: true, passive: true });
  window.addEventListener("wheel", stop, { once: true, passive: true });
  return stop;
 }, [route]);
 const navigate = (view: View, patch: Partial<RouteState> = {}) => {
  if (view === current.current.view && !Object.keys(patch).length) return;
  save();
  const value = nextRoute(current.current, view, patch);
  window.history.pushState({ ...window.history.state, katuRoute: value }, "");
  commit(value);
 };
 const replace = (view: View, patch: Partial<RouteState> = {}) => {
  const value = nextRoute(current.current, view, patch, true);
  window.history.replaceState({ ...window.history.state, katuRoute: value }, "");
  commit(value);
 };
 const back = () => current.current.depth > 0 ? window.history.back() : replace("home");
 return { route, navigate, replace, back };
}
