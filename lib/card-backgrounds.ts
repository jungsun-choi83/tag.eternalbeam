import type { CardBackgroundParam } from "@/lib/sdxl-prompt";



/** 카드 페이지 2×2 컨셉 선택 — 썸네일은 UI 참고용, API는 `background`만 프롬프트로 매핑 */

export const CARD_BACKGROUND_OPTIONS: {

  id: CardBackgroundParam;

  label: string;

  preview: string;

}[] = [

  { id: "beach", label: "바다", preview: "/styles/beach.png" },

  { id: "cherry", label: "벚꽃", preview: "/styles/cherry%20blossem.png" },

  { id: "sky", label: "하늘", preview: "/styles/dream.png" },

  { id: "sunset", label: "노을", preview: "/styles/sunset.png" },

];


