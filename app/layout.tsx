import { MobileViewport } from "../components/mobile-viewport";
import type { Metadata } from "next";
import "./globals.css";
import "./ui-consistency.css";

export const metadata: Metadata = {
  title: "卡兔服务导航",
  description: "卡兔本地生活与精选好物移动端体验",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script id="katu-theme-init" dangerouslySetInnerHTML={{ __html: `(function(){var r=document.documentElement,s='light',m='balanced';try{s=localStorage.getItem('katu.theme.surface')==='dark'?'dark':'light';m=localStorage.getItem('katu.theme.mode')||'balanced'}catch(e){}r.dataset.katuTheme=s;r.style.colorScheme=s;r.style.backgroundColor=s==='dark'?'#050506':'#edf0f3';var v=m==='clear'?['.58','26px']:m==='solid'?['.86','16px']:['.72','22px'];r.style.setProperty('--katu-glass-alpha',v[0]);r.style.setProperty('--katu-blur',v[1])})();` }} />
      </head>
      <body><MobileViewport />{children}</body>
    </html>
  );
}
