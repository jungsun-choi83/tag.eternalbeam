import { NextRequest, NextResponse } from "next/server";
import { storageUploadErrorHint } from "@/lib/ensure-pet-bucket";
import { normalizeImageMime, resolveProfileImageUrl } from "@/lib/resolve-profile-image";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

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
    const mime = normalizeImageMime((file as File).type || "image/jpeg");

    const resolved = await resolveProfileImageUrl({ tagId, buf, mime, bucket });
    return NextResponse.json({
      imageUrl: resolved.imageUrl,
      ...(resolved.storageFallback ? { storageFallback: true, warning: resolved.warning } : {}),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const hint = storageUploadErrorHint(message);
    return NextResponse.json(
      { error: "업로드 실패", detail: message, ...(hint ? { hint } : {}) },
      { status: 500 },
    );
  }
}
