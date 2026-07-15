import "server-only";

import { safeTagPathSegment } from "@/lib/safe-tag-path";
import {
  bufferToDataUrl,
  isStorageNetworkError,
  uploadStorageObject,
} from "@/lib/supabase-storage";

const DATA_URL_MAX = 480_000;

export async function resolveProfileImageUrl(params: {
  tagId: string;
  buf: Buffer;
  mime: string;
  bucket: string;
}): Promise<{ imageUrl: string; storageFallback?: boolean; warning?: string }> {
  const ext = params.mime.includes("png") ? "png" : params.mime.includes("webp") ? "webp" : "jpg";
  const path = `${safeTagPathSegment(params.tagId)}/profile-${Date.now()}.${ext}`;

  const uploaded = await uploadStorageObject({
    bucket: params.bucket,
    path,
    body: params.buf,
    contentType: params.mime,
  });

  if (uploaded.ok) {
    return { imageUrl: uploaded.publicUrl };
  }

  const dataUrl = isStorageNetworkError(uploaded.message)
    ? bufferToDataUrl(params.buf, params.mime, DATA_URL_MAX)
    : null;

  if (dataUrl) {
    return {
      imageUrl: dataUrl,
      storageFallback: true,
      warning:
        "클라우드 저장소(Supabase)에 연결되지 않아 사진을 임시 방식으로 저장했습니다. 등록은 가능하지만, Vercel의 SUPABASE 설정을 확인해 주세요.",
    };
  }

  throw new Error(uploaded.message || "업로드 실패");
}

export function normalizeImageMime(rawType: string): string {
  const base = rawType.split(";")[0]?.trim() || "image/jpeg";
  return base.startsWith("image/") ? base : "image/jpeg";
}
