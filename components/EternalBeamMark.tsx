"use client";

import { useMemo } from "react";

type Props = {
  /** 등록 헤더 등 왼쪽 정렬 */
  align?: "center" | "start";
  className?: string;
};

/**
 * 상단 브랜드: 확대 텍스트 + 오로라 그라데이션 + 아래에서 올라오는 스파클
 */
export function EternalBeamMark({ align = "center", className = "" }: Props) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: `${4 + ((i * 17) % 92)}%`,
        delay: `${(i * 0.12) % 2.4}s`,
        duration: `${2.1 + (i % 5) * 0.22}s`,
      })),
    [],
  );

  const wrap =
    align === "start"
      ? "inline-flex w-full max-w-full flex-col items-start"
      : "mx-auto inline-flex max-w-full flex-col items-center";

  return (
    <div className={`${wrap} ${className}`.trim()}>
      <div className="relative pb-1 pt-1">
        <div
          className="pointer-events-none absolute -bottom-1 left-0 right-0 h-[3.25rem] overflow-visible"
          aria-hidden
        >
          {sparkles.map((s, i) => (
            <span
              key={i}
              className="eb-brand-sparkle"
              style={{
                left: s.left,
                animationDelay: s.delay,
                animationDuration: s.duration,
              }}
            />
          ))}
        </div>
        <p
          className={`eb-brand-title relative z-[1] uppercase ${align === "start" ? "text-left" : "text-center"}`}
        >
          Eternal Beam
        </p>
      </div>
    </div>
  );
}
