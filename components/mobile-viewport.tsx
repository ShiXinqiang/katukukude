"use client";
import {useEffect} from "react";
export function MobileViewport(){
 useEffect(()=>{
  const viewport=window.visualViewport;
  const update=()=>{
   const height=viewport?.height||window.innerHeight;
   const focused=document.activeElement?.matches('input,textarea,select');
   const inset=focused?Math.max(0,window.innerHeight-height-(viewport?.offsetTop||0)):0;
   document.documentElement.style.setProperty('--katu-visible-height',`${height}px`);
   document.documentElement.style.setProperty('--katu-keyboard-inset',`${inset}px`);
   document.documentElement.dataset.keyboardOpen=String(!!focused&&inset>100);
  };
  update();viewport?.addEventListener('resize',update);viewport?.addEventListener('scroll',update);window.addEventListener('resize',update);document.addEventListener('focusin',update);document.addEventListener('focusout',update);
  return()=>{viewport?.removeEventListener('resize',update);viewport?.removeEventListener('scroll',update);window.removeEventListener('resize',update);document.removeEventListener('focusin',update);document.removeEventListener('focusout',update)};
 },[]);
 return null;
}
