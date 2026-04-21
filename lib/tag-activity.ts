import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export type OwnerTagSummary = {
  messageCount: number;
  locationCount: number;
  photoCount: number;
  scanCount: number;
};

export async function getOwnerTagSummary(tagId: string): Promise<OwnerTagSummary> {
  const empty: OwnerTagSummary = {
    messageCount: 0,
    locationCount: 0,
    photoCount: 0,
    scanCount: 0,
  };
  if (!isSupabaseConfigured()) return empty;

  const supabase = getSupabaseAdmin();

  const [messages, locations, photos, scans] = await Promise.all([
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("tag_id", tagId),
    supabase.from("finder_locations").select("id", { count: "exact", head: true }).eq("tag_id", tagId),
    supabase.from("finder_photos").select("id", { count: "exact", head: true }).eq("tag_id", tagId),
    supabase.from("tag_scans").select("id", { count: "exact", head: true }).eq("tag_id", tagId),
  ]);

  return {
    messageCount: messages.count ?? 0,
    locationCount: locations.count ?? 0,
    photoCount: photos.count ?? 0,
    scanCount: scans.count ?? 0,
  };
}
