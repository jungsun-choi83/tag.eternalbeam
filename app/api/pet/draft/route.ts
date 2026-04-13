import { NextRequest, NextResponse } from "next/server";
import { getPet, upsertPet } from "@/lib/pet";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const NO_SB = {
  error:
    "Supabase가 설정되지 않았습니다. .env.local에 NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 추가한 뒤 서버를 재시작하세요.",
};

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(NO_SB, { status: 503 });
    }
    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const existing = await getPet(tagId);
    const payload: Record<string, unknown> = {
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
      description: String(body.description ?? ""),
      raw_image_url: body.raw_image_url ?? null,
      cutout_url: body.cutout_url ?? null,
      final_image_url: body.final_image_url ?? null,
      style: body.style ?? null,
      paid: Boolean(body.paid),
    };
    if (existing?.owner_key) {
      payload.owner_key = existing.owner_key;
    }

    const { error } = await upsertPet(tagId, payload);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
