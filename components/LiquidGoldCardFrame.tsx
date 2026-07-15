"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** 메인 카드: 회전 테두리(장식) + 고정 글래스 본문(입력 가능) */
export function LiquidGoldCardFrame({ children, className = "", style }: Props) {
  return (
    <div
      className={`eb-home-liquid-frame relative w-full max-w-[400px] rounded-[24px] ${className}`}
      style={style}
    >
      <div className="eb-home-card-spin-border absolute inset-0 rounded-[24px]" aria-hidden />
      <div className="eb-home-card-glass relative rounded-[22px] px-6 py-8 sm:px-8 sm:py-9">
        {children}
      </div>
    </div>
  );
}
