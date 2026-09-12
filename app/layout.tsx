import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
