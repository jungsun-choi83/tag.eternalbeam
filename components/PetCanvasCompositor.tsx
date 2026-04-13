"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  clampComposite,
  COMPOSITE_LIMITS,
  computeDogLayout,
  pointHitsDog,
  type PetCompositeTransform,
} from "@/lib/pet-composite-layout";

const CANVAS = 1024;
/** 한 손가락 드래그 시 offset 변화 감도 (좌우·상하 동일) */
const K_DRAG = CANVAS * 0.28;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src.slice(0, 80)}`));
    img.src = src;
  });
}

function clientToCanvas(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const sx = CANVAS / rect.width;
  const sy = CANVAS / rect.height;
  return {
    x: (clientX - rect.left) * sx,
    y: (clientY - rect.top) * sy,
  };
}

export type PetCanvasCompositorHandle = {
  exportPngDataUrl: () => Promise<string | null>;
};

type Props = {
  backgroundSrc: string;
  cutoutUrl: string;
  transform: PetCompositeTransform;
  /** 강아지를 드래그해 위치(offset) 갱신 */
  onTransformChange?: (next: PetCompositeTransform) => void;
  disabled?: boolean;
};

/**
 * 배경(약 blur) + 그림자 + 누끼(필터·선명) + 상단 라이팅 오버레이.
 * 강아지 영역을 끌면 배경 위 위치를 바꿀 수 있음.
 */
export const PetCanvasCompositor = forwardRef<PetCanvasCompositorHandle, Props>(
  function PetCanvasCompositor(
    { backgroundSrc, cutoutUrl, transform, onTransformChange, disabled },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loaded, setLoaded] = useState<{ bg: HTMLImageElement; dog: HTMLImageElement } | null>(null);
    const [loadErr, setLoadErr] = useState<string | null>(null);
    const transformRef = useRef(transform);
    transformRef.current = transform;

    const pointersRef = useRef(new Map<number, { x: number; y: number }>());
    const dragRef = useRef<{
      startPx: number;
      startPy: number;
      startOx: number;
      startOy: number;
    } | null>(null);
    const pinchRef = useRef<{ d0: number; s0: number } | null>(null);

    useEffect(() => {
      let cancelled = false;
      setLoadErr(null);
      setLoaded(null);
      (async () => {
        try {
          const [bg, dog] = await Promise.all([loadImage(backgroundSrc), loadImage(cutoutUrl)]);
          if (!cancelled) setLoaded({ bg, dog });
        } catch (e) {
          if (!cancelled) {
            setLoadErr(e instanceof Error ? e.message : "이미지 로드 오류");
            setLoaded(null);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [backgroundSrc, cutoutUrl]);

    useLayoutEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !loaded || disabled) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = CANVAS;
      const H = CANVAS;
      ctx.clearRect(0, 0, W, H);

      const { bg, dog } = loaded;

      ctx.save();
      ctx.filter = "blur(2px)";
      const bw = bg.naturalWidth;
      const bh = bg.naturalHeight;
      const cover = Math.max(W / bw, H / bh);
      const dw = bw * cover;
      const dh = bh * cover;
      ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);
      ctx.restore();

      const layout = computeDogLayout(W, H, transform, dog.naturalWidth, dog.naturalHeight);
      const { dogW, dogH, cx, cy, rad, y } = layout;

      ctx.save();
      ctx.globalAlpha = 0.38;
      ctx.beginPath();
      ctx.ellipse(cx, y + dogH * 0.88, dogW * 0.42, dogH * 0.12, 0, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.filter = "blur(16px)";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad);
      ctx.translate(-dogW / 2, -dogH / 2);
      ctx.shadowColor = "rgba(0,0,0,0.28)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 10;
      ctx.filter = "brightness(1.06) contrast(1.05) saturate(1.12) sepia(0.07)";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(dog, 0, 0, dogW, dogH);
      ctx.restore();

      const g = ctx.createRadialGradient(W * 0.5, 0, 0, W * 0.5, H * 0.42, H * 0.95);
      g.addColorStop(0, "rgba(255, 252, 245, 0.28)");
      g.addColorStop(0.45, "rgba(255, 250, 240, 0.08)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.save();
      ctx.fillStyle = g;
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }, [loaded, transform, backgroundSrc, cutoutUrl, disabled]);

    const syncPinchFromPointers = useCallback(() => {
      if (!onTransformChange || pointersRef.current.size < 2) return;
      const pts = Array.from(pointersRef.current.values()).slice(0, 2);
      const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const p = pinchRef.current;
      if (!p) return;
      const ratio = Math.max(20, d) / p.d0;
      const nextScale = p.s0 * ratio;
      const t = transformRef.current;
      onTransformChange(clampComposite({ ...t, scale: nextScale }));
    }, [onTransformChange]);

    const onPointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (disabled || !loaded || !onTransformChange) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x, y } = clientToCanvas(e.clientX, e.clientY, canvas);
        pointersRef.current.set(e.pointerId, { x, y });
        canvas.setPointerCapture(e.pointerId);

        if (pointersRef.current.size >= 2) {
          dragRef.current = null;
          const pts = Array.from(pointersRef.current.values()).slice(0, 2);
          const d0 = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          pinchRef.current = { d0: Math.max(28, d0), s0: transformRef.current.scale };
          syncPinchFromPointers();
          return;
        }

        const layout = computeDogLayout(
          CANVAS,
          CANVAS,
          transformRef.current,
          loaded.dog.naturalWidth,
          loaded.dog.naturalHeight,
        );
        if (pointHitsDog(x, y, layout)) {
          pinchRef.current = null;
          dragRef.current = {
            startPx: x,
            startPy: y,
            startOx: transformRef.current.offsetX,
            startOy: transformRef.current.offsetY,
          };
        }
      },
      [disabled, loaded, onTransformChange, syncPinchFromPointers],
    );

    const onPointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!onTransformChange || !loaded) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x, y } = clientToCanvas(e.clientX, e.clientY, canvas);
        pointersRef.current.set(e.pointerId, { x, y });

        if (pointersRef.current.size >= 2 && pinchRef.current) {
          syncPinchFromPointers();
          return;
        }

        if (!dragRef.current) return;
        const dx = x - dragRef.current.startPx;
        const dy = y - dragRef.current.startPy;
        const nextOx = dragRef.current.startOx + dx / K_DRAG;
        const nextOy = dragRef.current.startOy + dy / K_DRAG;
        const t = transformRef.current;
        onTransformChange(
          clampComposite({
            ...t,
            offsetX: nextOx,
            offsetY: nextOy,
          }),
        );
      },
      [loaded, onTransformChange, syncPinchFromPointers],
    );

    const endDrag = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (canvas?.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size < 2) {
          pinchRef.current = null;
        }
        dragRef.current = null;
      },
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || disabled || !onTransformChange) return;
      const onWheel = (ev: WheelEvent) => {
        if (!ev.ctrlKey && !ev.metaKey) return;
        ev.preventDefault();
        const t = transformRef.current;
        const delta = -ev.deltaY * 0.0022;
        const next = Math.min(
          COMPOSITE_LIMITS.scaleMax,
          Math.max(COMPOSITE_LIMITS.scaleMin, t.scale + delta),
        );
        onTransformChange(clampComposite({ ...t, scale: next }));
      };
      canvas.addEventListener("wheel", onWheel, { passive: false });
      return () => canvas.removeEventListener("wheel", onWheel);
    }, [disabled, onTransformChange]);

    useImperativeHandle(ref, () => ({
      exportPngDataUrl: async () => {
        const c = canvasRef.current;
        if (!c || !loaded) return null;
        return c.toDataURL("image/png");
      },
    }));

    const canDrag = Boolean(loaded && onTransformChange && !disabled);

    return (
      <div className="space-y-2">
        {loadErr ? (
          <p className="text-center text-sm text-rose-200">{loadErr}</p>
        ) : null}
        <canvas
          ref={canvasRef}
          width={CANVAS}
          height={CANVAS}
          className={`mx-auto w-full max-w-[min(100%,420px)] rounded-xl border border-white/10 bg-black/20 touch-none select-none ${
            canDrag ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={{ touchAction: "none" }}
          aria-label="합성 미리보기 — 한 손가락으로 이동, 두 손가락으로 확대·축소"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        {!loaded && !loadErr ? (
          <p className="text-center text-xs text-[var(--muted)]">미리보기 불러오는 중…</p>
        ) : null}
      </div>
    );
  },
);
