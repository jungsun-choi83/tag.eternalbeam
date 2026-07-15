import { NextResponse } from "next/server";
import { probeSupabaseReachability } from "@/lib/supabase-storage";

export const runtime = "nodejs";

/** 운영 점검: Vercel ↔ Supabase 연결 상태 (비밀 노출 없음) */
export async function GET() {
  const probe = await probeSupabaseReachability();
  return NextResponse.json(probe);
}
