import { NextRequest, NextResponse } from "next/server";
import { ensurePetAssetsBucket } from "@/lib/ensure-pet-bucket";
import { getPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { safeTagPathSegment } from "@/lib/safe-tag-path";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;

function extFromMime(mime: string) {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("heic") || mime.includes("heif")) return "heic";
  return "jpg";
}

export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
    }

    const form = await req.formData();
    const tagId = String(form.get("tagId") ?? "").trim();
    const file = form.get("file");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!(file instanceof Blob) || file.size === 0) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "파일이 너무 큽니다. (최대 12MB)" }, { status: 413 });
    }

    const pet = await getPet(tagId);
    if (!pet || !isPetRegistered(pet)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const rawType = ((file as File).type || "").trim();
    const baseMime = rawType.split(";")[0]?.trim().toLowerCase() ?? "";
    const contentType =
      baseMime.startsWith("image/") ? baseMime : rawType === "" ? "image/jpeg" : baseMime;
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    try {
      await ensurePetAssetsBucket(supabase, bucket);
    } catch (be) {
      const msg = be instanceof Error ? be.message : String(be);
      return NextResponse.json({ error: "Storage 준비 실패", detail: msg }, { status: 500 });
    }

    const prefix = safeTagPathSegment(tagId);
    const id = crypto.randomUUID();
    const ext = extFromMime(contentType);
    const path = `${prefix}/finder-photo-${id}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, buf, {
      contentType,
      upsert: false,
    });
    if (upErr) {
      return NextResponse.json({ error: "업로드 실패", detail: upErr.message }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: dbErr } = await supabase.from("finder_photos").insert({
      tag_id: tagId,
      storage_path: path,
      public_url: publicUrl,
    });
    if (dbErr) {
      return NextResponse.json({ error: "기록 저장 실패", detail: dbErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, url: publicUrl });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
