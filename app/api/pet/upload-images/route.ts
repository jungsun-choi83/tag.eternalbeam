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

export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase가 설정되지 않았습니다.", hint: ".env.local 키를 확인하세요." },
        { status: 503 },
      );
    }

    const form = await req.formData();
    const raw = form.get("raw");
    const cutout = form.get("cutout");
    const tagId = String(form.get("tagId") ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!(raw instanceof Blob) || raw.size === 0) {
      return NextResponse.json({ error: "raw image is required" }, { status: 400 });
    }
    if (!(cutout instanceof Blob) || cutout.size === 0) {
      return NextResponse.json({ error: "cutout image is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
      await ensurePetAssetsBucket(supabase, bucket);
    } catch (be) {
      const msg = be instanceof Error ? be.message : String(be);
      return NextResponse.json(
        {
          error: "Storage 버킷을 준비하지 못했습니다.",
          detail: msg,
          hint:
            "SUPABASE_SERVICE_ROLE_KEY를 .env.local에 넣었는지 확인하세요. anon 키만 쓰면 Storage 정책 때문에 업로드가 막힐 수 있습니다.",
        },
        { status: 500 },
      );
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
      return NextResponse.json(
        {
          error: "원본 업로드 실패",
          detail: rawErr.message,
          hint: `버킷 "${bucket}"이 public인지, RLS 정책이 업로드를 허용하는지 확인하세요. service role 키 사용을 권장합니다.`,
        },
        { status: 500 },
      );
    }
    const { data: rawPub } = supabase.storage.from(bucket).getPublicUrl(rawPath);

    const cutBuf = Buffer.from(await cutout.arrayBuffer());
    const cutPath = `${prefix}/cutout-${stamp}.png`;
    let cutoutUrl: string;
    try {
      cutoutUrl = await uploadPng(supabase, cutPath, cutBuf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { error: "누끼 업로드 실패", detail: msg, hint: `버킷 "${bucket}" 확인` },
        { status: 500 },
      );
    }

    return NextResponse.json({
      rawImageUrl: rawPub.publicUrl,
      cutoutUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        error: "upload-images 처리 중 오류",
        detail: message,
        hint: "요청 본문이 너무 크거나 네트워크 오류일 수 있습니다. 이미지 용량을 줄여 보세요.",
      },
      { status: 500 },
    );
  }
}
