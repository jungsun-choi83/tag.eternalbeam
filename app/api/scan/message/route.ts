import { NextRequest, NextResponse } from "next/server";
import { getPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const MAX_LEN = 800;

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "").trim();
    const raw = typeof body.body === "string" ? body.body : "";
    const text = raw.trim().slice(0, MAX_LEN);
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (text.length < 1) {
      return NextResponse.json({ error: "메시지를 입력해 주세요." }, { status: 400 });
    }

    const pet = await getPet(tagId);
    if (!pet || !isPetRegistered(pet)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("messages").insert({
      tag_id: tagId,
      body: text,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
