"use client";

import type { CSSProperties, ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
};

/** 메인 카드: 글래스모피즘 + 왼쪽 꼭지점에서 도는 빛 테두리 */
export function LiquidGoldCardFrame({ children, className = "", style }: Props) {
  return (
    <div
      className={`eb-home-liquid-frame relative w-full max-w-[400px] rounded-[24px] ${className}`}
      style={style}
    >
      <div className="eb-home-card-spin-border relative rounded-[24px]">
        <div className="eb-home-card-spin-border-inner rounded-[22px] px-6 py-8 sm:px-8 sm:py-9">
          <div className="relative z-[1]">{children}</div>
        </div>
      </div>
    </div>
  );
}
