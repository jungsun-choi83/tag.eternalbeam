import { NextRequest, NextResponse } from "next/server";
import { ensurePetAssetsBucket } from "@/lib/ensure-pet-bucket";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";
import { uploadPng } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 120;

function safePrefix(tagId: string) {
  const t = tagId.trim() || "anon";
  return t.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 96) || "tag";
}

/**
 * remove.bg API로 누끼 생성 후 Storage에 원본·누끼 업로드.
 * `REMOVE_BG_API_KEY`가 없으면 501 + `fallback: true` → 클라이언트는 @imgly/background-removal 등으로 대체.
 */
export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";
  const apiKey = process.env.REMOVE_BG_API_KEY;

  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "REMOVE_BG_API_KEY is not configured", fallback: true },
      { status: 501 },
    );
  }

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase가 설정되지 않았습니다.", hint: ".env.local 키를 확인하세요." },
        { status: 503 },
      );
    }

    const form = await req.formData();
    const raw = form.get("raw");
    const tagId = String(form.get("tagId") ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!(raw instanceof Blob) || raw.size === 0) {
      return NextResponse.json({ error: "raw image is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    try {
      await ensurePetAssetsBucket(supabase, bucket);
    } catch (be) {
      const msg = be instanceof Error ? be.message : String(be);
      return NextResponse.json({ error: "Storage 버킷을 준비하지 못했습니다.", detail: msg }, { status: 500 });
    }

    const prefix = safePrefix(tagId);
    const stamp = Date.now();
    const rawMime = (raw as File).type || "image/jpeg";
    const rawExt = rawMime.includes("png") ? "png" : rawMime.includes("webp") ? "webp" : "jpg";
    const rawBuf = Buffer.from(await raw.arrayBuffer());
    const rawPath = `${prefix}/raw-${stamp}.${rawExt}`;

    const { error: rawErr } = await supabase.storage.from(bucket).upload(rawPath, rawBuf, {
      contentType: rawMime,
      upsert: true,
    });
    if (rawErr) {
      return NextResponse.json({ error: "원본 업로드 실패", detail: rawErr.message }, { status: 500 });
    }
    const { data: rawPub } = supabase.storage.from(bucket).getPublicUrl(rawPath);

    const rmForm = new FormData();
    rmForm.append("image_file", new File([rawBuf], `upload.${rawExt}`, { type: rawMime }));
    rmForm.append("size", "auto");

    const rmRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey.trim() },
      body: rmForm,
    });
    if (!rmRes.ok) {
      const text = await rmRes.text().catch(() => "");
      return NextResponse.json(
        { error: "remove.bg 요청 실패", detail: text || rmRes.statusText, fallback: true },
        { status: 502 },
      );
    }

    const cutBuf = Buffer.from(await rmRes.arrayBuffer());
    const cutPath = `${prefix}/cutout-${stamp}.png`;
    let cutoutUrl: string;
    try {
      cutoutUrl = await uploadPng(supabase, cutPath, cutBuf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json({ error: "누끼 업로드 실패", detail: msg }, { status: 500 });
    }

    return NextResponse.json({
      rawImageUrl: rawPub.publicUrl,
      cutoutUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message, fallback: true }, { status: 500 });
  }
}
