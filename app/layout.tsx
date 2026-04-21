import type { Metadata } from "next";
import "./globals.css";

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
        <div className="mx-auto min-h-screen w-full max-w-[480px] px-4 pb-10 pt-6 sm:px-5 sm:pt-10">
          {children}
        </div>
      </body>
    </html>
  );
}
