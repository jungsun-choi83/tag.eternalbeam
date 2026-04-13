/** Canvas 합성용 (Replicate/SDXL 없음) */
export type PetCompositeTransform = {
  /** 0.3 ~ 1.2 — 캔버스 너비 대비 강아지 폭 약 40~65%로 매핑 */
  scale: number;
  /** -1 ~ 1 좌우 이동 */
  offsetX: number;
  /** -1 ~ 1 상하 배치 (미리보기 드래그·슬라이더 공통) */
  offsetY: number;
  /** -45 ~ 45 도 */
  rotation: number;
};

export const DEFAULT_PET_COMPOSITE: PetCompositeTransform = {
  scale: 0.75,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export const COMPOSITE_LIMITS = {
  scaleMin: 0.3,
  scaleMax: 1.2,
  /** 드래그로 배치할 수 있도록 여유 확대 */
  offsetXMin: -1.2,
  offsetXMax: 1.2,
  offsetYMin: -1.1,
  offsetYMax: 1.1,
  rotationMin: -45,
  rotationMax: 45,
} as const;

export type DogLayout = {
  dogW: number;
  dogH: number;
  x: number;
  y: number;
  cx: number;
  cy: number;
  rad: number;
};

/** 캔버스 좌표계에서 강아지 박스(회전 전 기준은 중심 cx,cy) */
export function computeDogLayout(
  W: number,
  H: number,
  transform: PetCompositeTransform,
  dogNaturalW: number,
  dogNaturalH: number,
): DogLayout {
  const tMin = 0.3;
  const tMax = 1.2;
  const s = Math.min(tMax, Math.max(tMin, transform.scale));
  const widthFrac = 0.4 + ((s - tMin) / (tMax - tMin)) * 0.25;
  const dogW = W * widthFrac;
  const dogH = dogW * (dogNaturalH / dogNaturalW);
  const x = W / 2 - dogW / 2 + transform.offsetX * W * 0.3;
  /** 기본은 하단 쪽 앵커 + offsetY로 캔버스 대부분 위아래 이동 가능 */
  const y = H - dogH * 0.88 + transform.offsetY * H * 0.42;
  const rad = (transform.rotation * Math.PI) / 180;
  const cx = x + dogW / 2;
  const cy = y + dogH / 2;
  return { dogW, dogH, x, y, cx, cy, rad };
}

/** 캔버스 좌표 (px,py)가 강아지 영역 안인지 (손가락 히트 여유) */
export function pointHitsDog(px: number, py: number, layout: DogLayout): boolean {
  const { cx, cy, rad, dogW, dogH } = layout;
  const cos = Math.cos(-rad);
  const sin = Math.sin(-rad);
  const dx = px - cx;
  const dy = py - cy;
  const lx = dx * cos - dy * sin;
  const ly = dx * sin + dy * cos;
  const pad = Math.min(dogW, dogH) * 0.12;
  return lx >= -dogW / 2 - pad && lx <= dogW / 2 + pad && ly >= -dogH / 2 - pad && ly <= dogH / 2 + pad;
}

export function clampComposite(t: PetCompositeTransform): PetCompositeTransform {
  return {
    scale: Math.min(COMPOSITE_LIMITS.scaleMax, Math.max(COMPOSITE_LIMITS.scaleMin, t.scale)),
    offsetX: Math.min(COMPOSITE_LIMITS.offsetXMax, Math.max(COMPOSITE_LIMITS.offsetXMin, t.offsetX)),
    offsetY: Math.min(COMPOSITE_LIMITS.offsetYMax, Math.max(COMPOSITE_LIMITS.offsetYMin, t.offsetY)),
    rotation: Math.min(COMPOSITE_LIMITS.rotationMax, Math.max(COMPOSITE_LIMITS.rotationMin, t.rotation)),
  };
}
