import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";
import { getPet } from "@/lib/pet";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false }, { status: 503 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    const kind = body.kind === "notify" ? "notify" : "view";
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const pet = await getPet(tagId);
    if (!pet?.notify_on_scan && kind === "view") {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("tag_scans").insert({
      tag_id: tagId,
      kind,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
