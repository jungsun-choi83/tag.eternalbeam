/** 배경 컨셉 키 (UI·스타일 미리보기용, AI 프롬프트 미사용) */
export type BackgroundType = "beach" | "spring" | "sky" | "sunset";

export type CardBackgroundParam = "beach" | "cherry" | "sky" | "sunset";

const LEGACY: Record<string, BackgroundType> = {
  cherry: "spring",
  spring: "spring",
  dream: "sky",
};

export function coerceBackgroundType(raw: string | null | undefined): BackgroundType {
  const v = String(raw ?? "beach").toLowerCase();
  if (v in LEGACY) return LEGACY[v]!;
  if (v === "beach" || v === "sky" || v === "sunset") return v;
  return "beach";
}
