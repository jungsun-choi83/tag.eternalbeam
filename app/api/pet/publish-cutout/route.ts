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

/** Scaled / adjusted cutout only (PNG). */
export async function POST(req: NextRequest) {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }

    const form = await req.formData();
    const cutout = form.get("cutout");
    const tagId = String(form.get("tagId") ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!(cutout instanceof Blob) || cutout.size === 0) {
      return NextResponse.json({ error: "cutout is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    try {
      await ensurePetAssetsBucket(supabase, bucket);
    } catch (be) {
      const msg = be instanceof Error ? be.message : String(be);
      return NextResponse.json(
        { error: "Storage 버킷을 준비하지 못했습니다.", detail: msg },
        { status: 500 },
      );
    }

    const prefix = safePrefix(tagId);
    const cutBuf = Buffer.from(await cutout.arrayBuffer());
    const cutPath = `${prefix}/cutout-scaled-${Date.now()}.png`;
    const cutoutUrl = await uploadPng(supabase, cutPath, cutBuf);

    return NextResponse.json({ cutoutUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
