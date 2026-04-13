import type { BackgroundType } from "@/lib/sdxl-prompt";
import { coerceBackgroundType } from "@/lib/sdxl-prompt";

/** @deprecated Use BackgroundType from @/lib/sdxl-prompt */
export type PetStyleId = BackgroundType;

export const PET_STYLES: {
  id: BackgroundType;
  label: string;
  preview: string;
}[] = [
  {
    id: "beach",
    label: "비치",
    preview: "/styles/beach.png",
  },
  {
    id: "spring",
    label: "봄·벚꽃",
    preview: "/styles/cherry%20blossem.png",
  },
  {
    id: "sky",
    label: "하늘",
    preview: "/styles/dream.png",
  },
  {
    id: "sunset",
    label: "선셋",
    preview: "/styles/sunset.png",
  },
];

export function getStyleById(id: string | null) {
  const normalized = coerceBackgroundType(id);
  return PET_STYLES.find((s) => s.id === normalized) ?? PET_STYLES[0];
}
