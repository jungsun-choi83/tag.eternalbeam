"use client";

import { CARD_BACKGROUND_OPTIONS } from "@/lib/card-backgrounds";
import type { CardBackgroundParam } from "@/lib/sdxl-prompt";

type Props = {
  value: CardBackgroundParam;
  onChange: (id: CardBackgroundParam) => void;
  disabled?: boolean;
};

export function CardBackgroundGrid({ value, onChange, disabled }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] font-medium text-[var(--muted)]">배경 선택</p>
      <div className="grid grid-cols-2 gap-3">
        {CARD_BACKGROUND_OPTIONS.map((s) => {
          const active = value === s.id;
          return (
            <button
              type="button"
              key={s.id}
              disabled={disabled}
              onClick={() => onChange(s.id)}
              className={`group overflow-hidden rounded-2xl border text-left transition duration-200 disabled:opacity-45 ${
                active
                  ? "scale-[1.02] border-[var(--accent-a)] shadow-[0_0_24px_rgba(124,140,255,0.35)]"
                  : "border-white/12 hover:scale-[1.02] hover:border-[var(--accent-a)]/35"
              } `}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.preview}
                alt=""
                className="h-[100px] w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="bg-black/35 px-3 py-2.5 text-[13px] font-medium text-white/95">{s.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
