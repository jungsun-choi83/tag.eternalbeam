"use client";

import { LAYOUT_LIMITS } from "@/lib/pet-layout";

type Props = {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
};

export function ScaleSlider({
  label = "크기 조절",
  value,
  onChange,
  min = LAYOUT_LIMITS.scaleMin,
  max = LAYOUT_LIMITS.scaleMax,
  step = 0.02,
  suffix,
  disabled,
}: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-white">{label}</span>
        <span className="tabular-nums text-sm font-medium text-[var(--accent-a)]">
          {suffix ?? `${Math.round(value * 100)}%`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--accent-a)] disabled:opacity-40"
      />
    </div>
  );
}
