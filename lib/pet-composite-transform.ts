/** Canvas 합성용 (rembg PNG + 배경) */
export type PetCompositeTransform = {
  /** 0.3 ~ 1.2 — 강아지 너비가 캔버스의 약 40~65%로 매핑 */
  scale: number;
  /** -1 ~ 1 좌우 이동 */
  offsetX: number;
  /** -0.25 ~ 0.25 세로 미세 조정 */
  offsetY: number;
  /** -45 ~ 45 도 */
  rotation: number;
};

export const DEFAULT_PET_COMPOSITE: PetCompositeTransform = {
  scale: 0.78,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
};

export function clampPetComposite(t: PetCompositeTransform): PetCompositeTransform {
  return {
    scale: Math.min(1.2, Math.max(0.3, t.scale)),
    offsetX: Math.min(1, Math.max(-1, t.offsetX)),
    offsetY: Math.min(0.25, Math.max(-0.25, t.offsetY)),
    rotation: Math.min(45, Math.max(-45, t.rotation)),
  };
}
