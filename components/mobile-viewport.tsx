"use client";
import { useEffect } from "react";

export function MobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    const update = () => {
      const height = viewport?.height || window.innerHeight;
      const focused = !!document.activeElement?.matches(
        'textarea,select,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([readonly]),[contenteditable="true"]',
      );
      const inset = focused ? Math.max(0, window.innerHeight - height - (viewport?.offsetTop || 0)) : 0;
      root.style.setProperty("--katu-visible-height", `${height}px`);
      root.style.setProperty("--katu-keyboard-inset", `${inset}px`);
      // Android WebViews can resize both heights equally: focus must hide navigation independently.
      root.dataset.inputFocused = String(focused);
      root.dataset.keyboardOpen = String(focused && inset > 100);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const observer = new MutationObserver(() => {
      if (root.dataset.inputFocused === "true") schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", schedule);
      delete root.dataset.inputFocused;
      delete root.dataset.keyboardOpen;
    };
  }, []);
  return null;
}
