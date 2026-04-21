import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";
import { getPet } from "@/lib/pet";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    const ownerKey = String(body.ownerKey ?? "");
    const sub = body.subscription as { endpoint?: string; keys?: { p256dh?: string; auth?: string } } | null;

    if (!tagId || !ownerKey || !sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }

    const pet = await getPet(tagId);
    if (!pet?.owner_key || pet.owner_key !== ownerKey) {
      return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("owner_push_subscriptions").upsert(
      {
        tag_id: tagId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}
