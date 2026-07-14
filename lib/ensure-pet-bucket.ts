import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * pet-assets 등 업로드용 버킷이 없으면 public 버킷으로 생성합니다.
 * (service role 키가 있어야 동작합니다.)
 *
 * listBuckets()는 Vercel 등 서버리스에서 "fetch failed"로 실패하는 경우가 있어
 * 사용하지 않습니다. createBucket은 멱등(이미 있으면 무시)으로 두고, 실패해도
 * 업로드 단계에서 최종 확인합니다.
 */
export async function ensurePetAssetsBucket(supabase: SupabaseClient, bucket: string) {
  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 52428800,
  });

  if (!createError) return;
  if (/already exists|duplicate/i.test(createError.message)) return;

  // 버킷이 이미 있거나 list/create API가 일시적으로 실패해도 업로드를 시도합니다.
  console.warn(`ensurePetAssetsBucket("${bucket}"): ${createError.message}`);
}

export function storageUploadErrorHint(message: string): string | undefined {
  const m = message.toLowerCase();
  if (m.includes("next_public_supabase_url") || m.includes("형식이 올바르지")) {
    return "Vercel의 NEXT_PUBLIC_SUPABASE_URL을 https://xxxx.supabase.co 형식으로 맞춰 주세요.";
  }
  if (m.includes("fetch failed") || m.includes("network") || m.includes("econnrefused")) {
    return "Supabase Storage 연결 실패입니다. (1) Supabase 프로젝트가 Paused가 아닌지 (2) Vercel에 SUPABASE_SERVICE_ROLE_KEY가 service_role 키인지 (3) URL이 올바른지 확인하세요.";
  }
  if (m.includes("bucket") && (m.includes("not found") || m.includes("does not exist"))) {
    return 'Supabase 대시보드 → Storage에서 "pet-assets" public 버킷을 만든 뒤 다시 시도하세요.';
  }
  if (m.includes("row-level security") || m.includes("policy") || m.includes("403")) {
    return "Storage RLS 정책 또는 service_role 키를 확인하세요. SUPABASE_SERVICE_ROLE_KEY가 Vercel에 설정돼 있어야 합니다.";
  }
  return undefined;
}
