import type { PetRow } from "./pet";

export type PublicPetRow = Omit<PetRow, "owner_key">;

export function isPetRegistered(p: PetRow | null): p is PetRow {
  if (!p) return false;
  return Boolean(p.name?.trim() && p.phone?.trim());
}

export function toPublicPet(pet: PetRow | null): PublicPetRow | null {
  if (!pet) return null;
  const { owner_key, ...rest } = pet;
  void owner_key;
  return rest;
}

/** 조회·카드용 대표 이미지 */
export function getPetDisplayImageUrl(p: PetRow): string | null {
  return p.final_image_url ?? p.image_url ?? p.raw_image_url ?? null;
}
