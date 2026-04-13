import type { SupabaseClient } from "@supabase/supabase-js";

export async function uploadPng(
  supabase: SupabaseClient,
  path: string,
  data: Buffer | ArrayBuffer,
) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";
  const { error } = await supabase.storage.from(bucket).upload(path, buf, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
  return pub.publicUrl;
}
