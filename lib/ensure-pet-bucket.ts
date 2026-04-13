import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * pet-assets 등 업로드용 버킷이 없으면 public 버킷으로 생성합니다.
 * (service role 키가 있어야 동작합니다.)
 */
export async function ensurePetAssetsBucket(supabase: SupabaseClient, bucket: string) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Storage 연결 실패: ${listError.message}`);
  }
  if (buckets?.some((b) => b.id === bucket)) return;

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: 52428800,
  });

  if (createError) {
    if (/already exists|duplicate/i.test(createError.message)) return;
    throw new Error(
      `버킷 "${bucket}"을(를) 자동 생성할 수 없습니다: ${createError.message}. Supabase 대시보드 → Storage에서 동일 이름의 public 버킷을 만든 뒤 다시 시도하세요.`,
    );
  }
}
