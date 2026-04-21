import "server-only";

import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";
import { phoneToE164Kr } from "@/lib/phone-e164";

function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_FROM_NUMBER?.trim(),
  );
}

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v == null || v.trim() === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function recentSmsExists(tagId: string, trigger: "view" | "notify", withinMinutes: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("owner_scan_sms_log")
    .select("id")
    .eq("tag_id", tagId)
    .eq("trigger", trigger)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.warn("[notify-owner-scan] rate check failed:", error.message);
    return true;
  }
  return (data?.length ?? 0) > 0;
}

async function logSmsSent(tagId: string, trigger: "view" | "notify"): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("owner_scan_sms_log").insert({ tag_id: tagId, trigger });
  if (error) {
    console.warn("[notify-owner-scan] log insert failed:", error.message);
  }
}

async function sendTwilioSms(to: string, body: string): Promise<{ ok: true } | { ok: false; detail: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const token = process.env.TWILIO_AUTH_TOKEN!.trim();
  const from = process.env.TWILIO_FROM_NUMBER!.trim();
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`;
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const params = new URLSearchParams({ To: to, From: from, Body: body });
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 400);
    return { ok: false, detail };
  }
  return { ok: true };
}

function appBaseUrl(): string {
  const u = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "";
}

/**
 * 스캔이 DB에 기록된 뒤 호출합니다. Twilio 환경변수가 없으면 조용히 생략합니다.
 * 실패해도 스캔 API 응답은 성공으로 유지하는 것이 목적입니다.
 */
export async function maybeSendOwnerScanSms(input: {
  tagId: string;
  petName: string;
  ownerPhone: string;
  kind: "view" | "notify";
}): Promise<void> {
  const { tagId, petName, ownerPhone, kind } = input;
  if (!ownerPhone.trim()) return;
  if (!twilioConfigured()) return;

  const to = phoneToE164Kr(ownerPhone);
  if (!to) {
    console.warn("[notify-owner-scan] invalid phone, skip SMS tagId=", tagId);
    return;
  }

  const viewCooldown = intEnv("SCAN_NOTIFY_VIEW_COOLDOWN_MINUTES", 30);
  const notifyCooldown = intEnv("SCAN_NOTIFY_PRESS_COOLDOWN_MINUTES", 10);
  const minutes = kind === "view" ? viewCooldown : notifyCooldown;
  if (await recentSmsExists(tagId, kind, minutes)) return;

  const name = petName.trim() || "아이";
  const base = appBaseUrl();
  const tagPath = `/tag/${encodeURIComponent(tagId)}`;
  const link = base ? `${base}${tagPath}` : tagPath;

  const body =
    kind === "view"
      ? `[Eternal Beam] ${name}의 QR이 방금 열렸어요. 기록: ${link}`
      : `[Eternal Beam] ${name}: 발견자가「보호자에게 알리기」를 눌렀어요. ${link}`;

  try {
    const result = await sendTwilioSms(to, body);
    if (result.ok) {
      await logSmsSent(tagId, kind);
    } else {
      console.warn("[notify-owner-scan] Twilio error:", result.detail);
    }
  } catch (e) {
    console.warn("[notify-owner-scan] Twilio fetch failed:", e instanceof Error ? e.message : e);
  }
}
