import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "勉強ナビ",
  description: "学習改善システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body style={{fontFamily:"'Noto Sans JP',sans-serif,system-ui"}}>{children}</body>
    </html>
  );
}
