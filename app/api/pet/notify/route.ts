import { NextRequest, NextResponse } from "next/server";
import { getPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }
    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    const ownerKey = String(body.ownerKey ?? "");
    const notifyOnScan = Boolean(body.notify_on_scan);

    if (!tagId || !ownerKey) {
      return NextResponse.json({ error: "tagId와 ownerKey가 필요합니다." }, { status: 400 });
    }

    const existing = await getPet(tagId);
    if (!isPetRegistered(existing)) {
      return NextResponse.json({ error: "등록된 반려견이 없습니다." }, { status: 404 });
    }
    if (!existing.owner_key || ownerKey !== existing.owner_key) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("pets")
      .update({ notify_on_scan: notifyOnScan })
      .eq("tag_id", tagId)
      .eq("owner_key", ownerKey);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
