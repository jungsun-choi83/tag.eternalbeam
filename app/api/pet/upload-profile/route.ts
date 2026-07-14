import { NextRequest, NextResponse } from "next/server";
import { ensurePetAssetsBucket, storageUploadErrorHint } from "@/lib/ensure-pet-bucket";
import { safeTagPathSegment } from "@/lib/safe-tag-path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

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

    const supabase = getSupabaseAdmin();
    await ensurePetAssetsBucket(supabase, bucket);

    const buf = Buffer.from(await file.arrayBuffer());
    const rawType = ((file as File).type || "").trim();
    const mime = rawType.split(";")[0]?.trim() || "image/jpeg";
    if (!mime.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${safeTagPathSegment(tagId)}/profile-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType: mime,
      upsert: true,
    });
    if (error) {
      const hint = storageUploadErrorHint(error.message);
      return NextResponse.json(
        { error: "업로드 실패", detail: error.message, ...(hint ? { hint } : {}) },
        { status: 500 },
      );
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ imageUrl: pub.publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
