import { NextRequest, NextResponse } from "next/server";
import { getPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase 미설정" }, { status: 503 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "").trim();
    const lat = num(body.lat);
    const lng = num(body.lng);
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
    if (lat == null || lng == null) {
      return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "invalid coordinates" }, { status: 400 });
    }

    const pet = await getPet(tagId);
    if (!pet || !isPetRegistered(pet)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("finder_locations").insert({
      tag_id: tagId,
      lat,
      lng,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
