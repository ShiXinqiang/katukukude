"use client";
import { useEffect } from "react";

export function MobileViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    let frame = 0;
    let lastHeight = "", lastInset = "";
    const update = () => {
      const height = viewport?.height || window.innerHeight;
      const focused = !!document.activeElement?.matches(
        'textarea,select,input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([readonly]),[contenteditable="true"]',
      );
      const inset = focused ? Math.max(0, window.innerHeight - height - (viewport?.offsetTop || 0)) : 0;
      const heightValue = `${Math.round(height)}px`;
      const insetValue = `${Math.round(inset)}px`;
      if (heightValue !== lastHeight) { root.style.setProperty("--katu-visible-height", heightValue); lastHeight = heightValue; }
      if (insetValue !== lastInset) { root.style.setProperty("--katu-keyboard-inset", insetValue); lastInset = insetValue; }
      // Android WebViews can resize both heights equally: focus must hide navigation independently.
      const inputFocused = String(focused), keyboardOpen = String(focused && inset > 100);
      if (root.dataset.inputFocused !== inputFocused) root.dataset.inputFocused = inputFocused;
      if (root.dataset.keyboardOpen !== keyboardOpen) root.dataset.keyboardOpen = keyboardOpen;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    const observer = new MutationObserver(() => {
      if (root.dataset.inputFocused === "true") schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    update();
    viewport?.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", schedule);
      delete root.dataset.inputFocused;
      delete root.dataset.keyboardOpen;
    };
  }, []);
  return null;
}
