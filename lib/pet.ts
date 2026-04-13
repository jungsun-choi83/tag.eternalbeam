import "server-only";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase-admin";

export type PetRow = {
  id: string;
  tag_id: string;
  name: string;
  phone: string;
  description: string;
  /** 보호 정보용 대표 사진 URL */
  image_url: string | null;
  raw_image_url: string | null;
  cutout_url: string | null;
  final_image_url: string | null;
  style: string | null;
  paid: boolean;
  notify_on_scan: boolean;
  /** 견주 전용 관리 URL 쿼리 (?owner=) 검증용 — 공개 API 응답에는 포함하지 않음 */
  owner_key: string | null;
  created_at: string;
};

export async function getPet(tagId: string) {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("pets")
    .select("*")
    .eq("tag_id", tagId)
    .maybeSingle();

  if (!data) return null;
  const row = data as { owner_key?: string | null };
  return {
    ...(data as PetRow),
    owner_key: typeof row.owner_key === "string" && row.owner_key.length > 0 ? row.owner_key : null,
  };
}

export async function upsertPet(tagId: string, payload: Record<string, unknown>) {
  const supabase = getSupabaseAdmin();
  return await supabase.from("pets").upsert(
    { tag_id: tagId, ...payload },
    { onConflict: "tag_id" },
  );
}

export async function setPetPaid(tagId: string, paid: boolean) {
  const supabase = getSupabaseAdmin();
  return await supabase.from("pets").update({ paid }).eq("tag_id", tagId);
}

/** 견주 링크 분실 시에만 사용. owner_key만 null로 비웁니다. */
export async function clearPetOwnerKey(tagId: string) {
  const supabase = getSupabaseAdmin();
  return await supabase.from("pets").update({ owner_key: null }).eq("tag_id", tagId);
}
