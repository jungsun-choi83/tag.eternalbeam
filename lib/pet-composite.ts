/** Canvas 합성용 변환 (rembg 누끼 + 배경 플레이트) */
export type PetCompositeTransform = {
  /** 0.3~1.2 — 캔버스 너비 대비 강아지 너비 40~65%로 매핑 */
  scale: number;
  /** -1~1 좌우 이동 */
  offsetX: number;
  /** -0.25~0.25 세로 미세 조정 */
  offsetY: number;
  /** 도(deg) */
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
  offsetXMin: -1,
  offsetXMax: 1,
  offsetYMin: -0.25,
  offsetYMax: 0.25,
  rotationMin: -45,
  rotationMax: 45,
} as const;

export function clampComposite(t: PetCompositeTransform): PetCompositeTransform {
  return {
    scale: Math.min(COMPOSITE_LIMITS.scaleMax, Math.max(COMPOSITE_LIMITS.scaleMin, t.scale)),
    offsetX: Math.min(COMPOSITE_LIMITS.offsetXMax, Math.max(COMPOSITE_LIMITS.offsetXMin, t.offsetX)),
    offsetY: Math.min(COMPOSITE_LIMITS.offsetYMax, Math.max(COMPOSITE_LIMITS.offsetYMin, t.offsetY)),
    rotation: Math.min(COMPOSITE_LIMITS.rotationMax, Math.max(COMPOSITE_LIMITS.rotationMin, t.rotation)),
  };
}

/** scale 슬라이더 → 캔버스 너비의 0.40~0.65 비율 */
export function dogWidthFractionFromScale(scale: number): number {
  const s = Math.min(COMPOSITE_LIMITS.scaleMax, Math.max(COMPOSITE_LIMITS.scaleMin, scale));
  const t = (s - COMPOSITE_LIMITS.scaleMin) / (COMPOSITE_LIMITS.scaleMax - COMPOSITE_LIMITS.scaleMin);
  return 0.4 + t * 0.25;
}
