/** 에디터·API 공통: -1~1 정규화 위치(0=중앙), scale은 “맞춤 크기” 대비 배율, rotation은 도(deg). */
export type PetLayoutTransform = {
  positionX: number;
  positionY: number;
  scale: number;
  rotation: number;
};

export const DEFAULT_PET_LAYOUT: PetLayoutTransform = {
  positionX: 0,
  positionY: 0,
  scale: 1,
  rotation: 0,
};

export const LAYOUT_LIMITS = {
  positionMin: -1,
  positionMax: 1,
  scaleMin: 0.25,
  scaleMax: 2.75,
  rotationMin: -45,
  rotationMax: 45,
} as const;

export function clampLayout(p: PetLayoutTransform): PetLayoutTransform {
  return {
    positionX: Math.min(LAYOUT_LIMITS.positionMax, Math.max(LAYOUT_LIMITS.positionMin, p.positionX)),
    positionY: Math.min(LAYOUT_LIMITS.positionMax, Math.max(LAYOUT_LIMITS.positionMin, p.positionY)),
    scale: Math.min(LAYOUT_LIMITS.scaleMax, Math.max(LAYOUT_LIMITS.scaleMin, p.scale)),
    rotation: Math.min(LAYOUT_LIMITS.rotationMax, Math.max(LAYOUT_LIMITS.rotationMin, p.rotation)),
  };
}
