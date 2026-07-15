import { NextRequest, NextResponse } from "next/server";
import { storageUploadErrorHint } from "@/lib/ensure-pet-bucket";
import { safeTagPathSegment } from "@/lib/safe-tag-path";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import {
  bufferToDataUrl,
  isStorageNetworkError,
  uploadStorageObject,
} from "@/lib/supabase-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

/** 대표 사진 1장만 업로드 (누끼 없음) */
export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const tagId = String(form.get("tagId") ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "파일이 너무 큽니다. (최대 12MB)" }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const rawType = ((file as File).type || "").trim();
    const mime = rawType.split(";")[0]?.trim() || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${safeTagPathSegment(tagId)}/profile-${Date.now()}.${ext}`;

    const uploaded = await uploadStorageObject({
      bucket,
      path,
      body: buf,
      contentType: mime,
    });
    if (!uploaded.ok) {
      const dataUrl = isStorageNetworkError(uploaded.message) ? bufferToDataUrl(buf, mime) : null;
      if (dataUrl) {
        return NextResponse.json({
          imageUrl: dataUrl,
          storageFallback: true,
          warning:
            "클라우드 저장소(Supabase)에 연결되지 않아 사진을 임시 방식으로 저장했습니다. 등록은 가능하지만, Vercel의 SUPABASE 설정을 확인해 주세요.",
        });
      }
      const hint = storageUploadErrorHint(uploaded.message);
      return NextResponse.json(
        { error: "업로드 실패", detail: uploaded.message, ...(hint ? { hint } : {}) },
        { status: 500 },
      );
    }
    return NextResponse.json({ imageUrl: uploaded.publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
