"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DraggableImage } from "@/components/DraggableImage";
import { ScaleSlider } from "@/components/ScaleSlider";
import { clampLayout, DEFAULT_PET_LAYOUT, LAYOUT_LIMITS, type PetLayoutTransform } from "@/lib/pet-layout";

type Props = {
  cutoutUrl: string;
  backgroundSrc: string;
  layout: PetLayoutTransform;
  onLayoutChange: (next: PetLayoutTransform) => void;
  disabled?: boolean;
};

/** 배경 미리보기 위 누끼 배치: 드래그·휠·핀치·슬라이더 */
export function ImageEditor({ cutoutUrl, backgroundSrc, layout, onLayoutChange, disabled }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const [stageSize, setStageSize] = useState({ w: 320, h: 320 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const setClamped = useCallback((next: PetLayoutTransform) => {
    onLayoutChange(clampLayout(next));
  }, [onLayoutChange]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      const L = layoutRef.current;
      onLayoutChange(clampLayout({ ...L, scale: L.scale + delta }));
    };
    const touchMove = (e: TouchEvent) => {
      if (disabled || e.touches.length !== 2 || !pinchRef.current) return;
      e.preventDefault();
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      const ratio = dist / pinchRef.current.dist;
      const L = layoutRef.current;
      const nextScale = pinchRef.current.scale * ratio;
      onLayoutChange(clampLayout({ ...L, scale: nextScale }));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchmove", touchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", touchMove);
    };
  }, [disabled, onLayoutChange]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || e.touches.length !== 2) return;
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      pinchRef.current = { dist, scale: layoutRef.current.scale };
    },
    [disabled],
  );

  const onTouchEnd = useCallback(() => {
    pinchRef.current = null;
  }, []);

  const onDragDelta = useCallback(
    (nx: number, ny: number) => {
      const L = layoutRef.current;
      onLayoutChange(clampLayout({ ...L, positionX: L.positionX + nx, positionY: L.positionY + ny }));
    },
    [onLayoutChange],
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px] font-medium text-[var(--muted)]">위치 · 크기 조절</p>
      <div
        ref={stageRef}
        className="relative mx-auto aspect-square w-full max-w-[min(100%,420px)] overflow-hidden rounded-2xl border border-white/15 bg-black/40 shadow-[0_0_32px_rgba(124,140,255,0.12)]"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={{ touchAction: "none" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={backgroundSrc}
          alt=""
          className="absolute inset-0 size-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25" />
        <DraggableImage
          src={cutoutUrl}
          layout={layout}
          stageRef={stageRef}
          stageWidth={stageSize.w}
          stageHeight={stageSize.h}
          onDragDelta={onDragDelta}
          disabled={disabled}
        />
      </div>

      <ScaleSlider
        label="크기 조절"
        value={layout.scale}
        onChange={(scale) => setClamped({ ...layout, scale })}
        disabled={disabled}
      />

      <ScaleSlider
        label="기울기 (°)"
        value={layout.rotation}
        onChange={(rotation) => setClamped({ ...layout, rotation })}
        min={LAYOUT_LIMITS.rotationMin}
        max={LAYOUT_LIMITS.rotationMax}
        step={1}
        suffix={`${Math.round(layout.rotation)}°`}
        disabled={disabled}
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button
          variant="outline"
          className="sm:flex-1"
          disabled={disabled}
          onClick={() => setClamped({ ...layout, positionX: 0, positionY: 0 })}
        >
          중앙 정렬
        </Button>
        <Button
          variant="outline"
          className="sm:flex-1"
          disabled={disabled}
          onClick={() => setClamped({ ...DEFAULT_PET_LAYOUT })}
        >
          초기화
        </Button>
      </div>

      <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
        드래그로 이동 · 휠 또는 핀치로 크기 · 슬라이더로 미세 조정
      </p>
    </div>
  );
}
