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
 * 누끼(배경 제거) 후 Storage에 원본·누끼 업로드.
 *
 * 우선순위:
 * 1. `REMBG_SERVICE_URL` — 직접 띄운 **rembg HTTP 서버**(예: `rembg s` 또는 Docker). multipart `file` 필드로 PNG 응답.
 * 2. `REMOVE_BG_API_KEY` — 상용 **remove.bg** (remove**dot**bg) API.
 * 3. 둘 다 없으면 501 + `fallback: true` → 클라이언트 `@imgly/background-removal`.
 */
export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";
  const rembgServiceUrl = process.env.REMBG_SERVICE_URL?.trim();
  const removeBgKey = process.env.REMOVE_BG_API_KEY?.trim();

  if (!rembgServiceUrl && !removeBgKey) {
    return NextResponse.json(
      {
        error: "REMBG_SERVICE_URL(rembg 서버) 또는 REMOVE_BG_API_KEY(remove.bg)가 없습니다.",
        fallback: true,
      },
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

    let cutBuf: Buffer;
    if (rembgServiceUrl) {
      const base = rembgServiceUrl.replace(/\/$/, "");
      const field = process.env.REMBG_FORM_FIELD?.trim() || "file";
      const rmForm = new FormData();
      rmForm.append(field, new File([rawBuf], `upload.${rawExt}`, { type: rawMime }));
      const headers: HeadersInit = {};
      const auth = process.env.REMBG_SERVICE_AUTH?.trim();
      if (auth) {
        headers.Authorization = auth.toLowerCase().startsWith("bearer ") ? auth : `Bearer ${auth}`;
      }
      const rmRes = await fetch(base, { method: "POST", body: rmForm, headers });
      if (!rmRes.ok) {
        const text = await rmRes.text().catch(() => "");
        return NextResponse.json(
          { error: "rembg 서버 요청 실패", detail: text || rmRes.statusText, fallback: true },
          { status: 502 },
        );
      }
      cutBuf = Buffer.from(await rmRes.arrayBuffer());
      if (cutBuf.length < 64) {
        return NextResponse.json(
          { error: "rembg 서버 응답이 비어 있거나 너무 짧습니다.", fallback: true },
          { status: 502 },
        );
      }
    } else {
      const rmForm = new FormData();
      rmForm.append("image_file", new File([rawBuf], `upload.${rawExt}`, { type: rawMime }));
      rmForm.append("size", "auto");

      const rmRes = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": removeBgKey! },
        body: rmForm,
      });
      if (!rmRes.ok) {
        const text = await rmRes.text().catch(() => "");
        return NextResponse.json(
          { error: "remove.bg 요청 실패", detail: text || rmRes.statusText, fallback: true },
          { status: 502 },
        );
      }
      cutBuf = Buffer.from(await rmRes.arrayBuffer());
    }

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
