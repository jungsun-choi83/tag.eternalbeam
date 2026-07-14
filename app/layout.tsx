import { LegalConsentGate } from "@/components/LegalConsentGate";
import { SiteFooter } from "@/components/SiteFooter";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ETERNAL BEAM · 기억으로 이어지는 태그",
  description: "이 작은 태그는, 한 아이의 기억으로 이어집니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(1.25rem,env(safe-area-inset-top,0px))] sm:px-5 sm:pt-10 sm:pb-10">
          {children}
          <SiteFooter />
        </div>
        <LegalConsentGate />
      </body>
    </html>
  );
}
