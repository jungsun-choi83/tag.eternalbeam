"use client";

import { useCallback, useRef, useState } from "react";
import type { PetLayoutTransform } from "@/lib/pet-layout";

type Props = {
  src: string;
  layout: PetLayoutTransform;
  stageRef: React.RefObject<HTMLElement | null>;
  stageWidth: number;
  stageHeight: number;
  onDragDelta: (normDeltaX: number, normDeltaY: number) => void;
  disabled?: boolean;
};

const MOVE_FACTOR = 0.38;

/** 에디터 스테이지 위 누끼: 드래그(포인터·터치)로 위치 이동 */
export function DraggableImage({
  src,
  layout,
  stageRef,
  stageWidth,
  stageHeight,
  onDragDelta,
  disabled,
}: Props) {
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const toNormDelta = useCallback((dxPx: number, dyPx: number) => {
    const el = stageRef.current;
    if (!el) return { nx: 0, ny: 0 };
    const r = el.getBoundingClientRect();
    return {
      nx: dxPx / (r.width * MOVE_FACTOR),
      ny: dyPx / (r.height * MOVE_FACTOR),
    };
  }, [stageRef]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = { x: e.clientX, y: e.clientY };
      setDragging(true);
    },
    [disabled],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || disabled) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      dragRef.current = { x: e.clientX, y: e.clientY };
      const { nx, ny } = toNormDelta(dx, dy);
      onDragDelta(nx, ny);
    },
    [disabled, onDragDelta, toNormDelta],
  );

  const endDrag = useCallback(() => {
    dragRef.current = null;
    setDragging(false);
  }, []);

  const ox = layout.positionX * stageWidth * MOVE_FACTOR;
  const oy = layout.positionY * stageHeight * MOVE_FACTOR;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      draggable={false}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute left-1/2 top-1/2 max-h-[88%] max-w-[88%] select-none touch-none object-contain ${
        dragging ? "" : "transition-transform duration-150 ease-out"
      }`}
      style={{
        transform: `translate(calc(-50% + ${ox}px), calc(-50% + ${oy}px)) rotate(${layout.rotation}deg) scale(${layout.scale})`,
        transformOrigin: "center center",
        cursor: disabled ? "default" : "grab",
      }}
    />
  );
}
