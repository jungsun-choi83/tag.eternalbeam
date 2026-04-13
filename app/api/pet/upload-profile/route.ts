import { NextRequest, NextResponse } from "next/server";
import { ensurePetAssetsBucket } from "@/lib/ensure-pet-bucket";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

function safePrefix(tagId: string) {
  const t = tagId.trim() || "anon";
  return t.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 96) || "tag";
}

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

    const supabase = getSupabaseAdmin();
    try {
      await ensurePetAssetsBucket(supabase, bucket);
    } catch (be) {
      const msg = be instanceof Error ? be.message : String(be);
      return NextResponse.json({ error: "Storage 준비 실패", detail: msg }, { status: 500 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = (file as File).type || "image/jpeg";
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${safePrefix(tagId)}/profile-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType: mime,
      upsert: true,
    });
    if (error) {
      return NextResponse.json({ error: "업로드 실패", detail: error.message }, { status: 500 });
    }
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ imageUrl: pub.publicUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
