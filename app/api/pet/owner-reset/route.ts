import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clearPetOwnerKey, getPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function secretsEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * 견주 전용 `?owner=` 링크를 잃었을 때, 사이트 운영자만 사용합니다.
 * POST JSON: { "tagId": "demo", "secret": "<TAG_OWNER_RESET_SECRET과 동일>" }
 * 성공 시 해당 태그의 owner_key가 비워지며, 이후 /tag/[id]/register 에서 다시 등록·새 키 발급이 가능합니다.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }
    const expected = process.env.TAG_OWNER_RESET_SECRET?.trim();
    if (!expected) {
      return NextResponse.json(
        { error: "TAG_OWNER_RESET_SECRET이 서버에 설정되어 있지 않습니다." },
        { status: 503 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const tagId = String(body.tagId ?? "").trim();
    const secret = String(body.secret ?? "");

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (!secretsEqual(secret, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pet = await getPet(tagId);
    if (!isPetRegistered(pet)) {
      return NextResponse.json({ error: "등록된 반려견이 없습니다." }, { status: 404 });
    }

    const { error } = await clearPetOwnerKey(tagId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, tagId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
