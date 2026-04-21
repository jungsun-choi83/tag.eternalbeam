"use client";

import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

/**
 * QR 태그 페이지 공통: 1~2초 감성 로딩 후 자식만 표시
 */
export function TagEntryShell({ children }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce ? 200 : 1000 + Math.random() * 900;
    const id = window.setTimeout(() => setReady(true), ms);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="relative">
      {!ready ? (
        <div
          className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-[#0b0b0b]"
          aria-busy="true"
          aria-label="불러오는 중"
        >
          <div className="relative flex h-32 w-32 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.28)_0%,transparent_70%)] motion-safe:animate-[eb-tag-pulse_2.4s_ease-in-out_infinite]"
              aria-hidden
            />
            <div
              className="relative size-2.5 rounded-full bg-[radial-gradient(circle_at_30%_30%,#fff8e0,#d4af37)] shadow-[0_0_28px_rgba(212,175,55,0.5)]"
              aria-hidden
            />
          </div>
          <p className="mt-12 max-w-[240px] text-center text-[13px] font-light leading-relaxed text-[#8a8275]">
            잠시만요…
            <br />
            <span className="text-[#c4a85a]/95">빛이 이어지고 있어요</span>
          </p>
        </div>
      ) : null}

      {ready ? (
        <div className="motion-safe:animate-[eb-tag-reveal_0.75s_ease-out_both] motion-reduce:animate-none">
          {children}
        </div>
      ) : null}
    </div>
  );
}
