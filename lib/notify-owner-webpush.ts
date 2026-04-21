import "server-only";

import webpush from "web-push";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase-admin";

type SubRow = { endpoint: string; p256dh: string; auth: string };

function webPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() &&
      process.env.WEB_PUSH_PRIVATE_KEY?.trim(),
  );
}

function intEnv(name: string, fallback: number): number {
  const v = process.env[name];
  if (v == null || v.trim() === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

async function recentWebPushSent(tagId: string, trigger: "view" | "notify", withinMinutes: number): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("owner_webpush_sent_log")
    .select("id")
    .eq("tag_id", tagId)
    .eq("trigger", trigger)
    .gte("created_at", since)
    .limit(1);

  if (error) {
    console.warn("[webpush] rate check failed:", error.message);
    return true;
  }
  return (data?.length ?? 0) > 0;
}

async function logWebPushSent(tagId: string, trigger: "view" | "notify"): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("owner_webpush_sent_log").insert({ tag_id: tagId, trigger });
  if (error) {
    console.warn("[webpush] sent log insert failed:", error.message);
  }
}

/**
 * 스캔이 DB에 기록된 뒤 호출. VAPID 키·구독이 없으면 생략. 비용 없음.
 */
export async function maybeSendOwnerWebPush(input: {
  tagId: string;
  petName: string;
  kind: "view" | "notify";
}): Promise<void> {
  if (!isSupabaseConfigured() || !webPushConfigured()) return;

  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY!.trim();
  const subject = process.env.WEB_PUSH_SUBJECT?.trim() || "mailto:noreply@eternalbeam.com";

  const supabase = getSupabaseAdmin();
  const { data: rows, error: selErr } = await supabase
    .from("owner_push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("tag_id", input.tagId);

  if (selErr || !rows?.length) return;

  const viewCooldown = intEnv("SCAN_WEBPUSH_VIEW_COOLDOWN_MINUTES", 15);
  const notifyCooldown = intEnv("SCAN_WEBPUSH_PRESS_COOLDOWN_MINUTES", 5);
  const minutes = input.kind === "view" ? viewCooldown : notifyCooldown;
  if (await recentWebPushSent(input.tagId, input.kind, minutes)) return;

  webpush.setVapidDetails(subject, publicKey, privateKey);

  const name = input.petName.trim() || "아이";
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  const path = `/tag/${encodeURIComponent(input.tagId)}`;
  const openUrl = base ? `${base}${path}` : path;

  const title = "Eternal Beam";
  const body =
    input.kind === "view" ? `${name}의 QR이 방금 열렸어요` : `${name}: 발견자가 알림을 요청했어요`;
  const payload = JSON.stringify({ title, body, url: openUrl });

  let anyOk = false;
  const deadEndpoints: string[] = [];

  for (const row of rows as SubRow[]) {
    const subscription = {
      endpoint: row.endpoint,
      keys: { p256dh: row.p256dh, auth: row.auth },
    };
    try {
      await webpush.sendNotification(subscription, payload, { TTL: 3600 });
      anyOk = true;
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "statusCode" in err
          ? Number((err as { statusCode: number }).statusCode)
          : 0;
      if (code === 404 || code === 410) {
        deadEndpoints.push(row.endpoint);
      } else {
        console.warn("[webpush] send failed:", code, err);
      }
    }
  }

  if (deadEndpoints.length > 0) {
    await supabase.from("owner_push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  if (anyOk) {
    await logWebPushSent(input.tagId, input.kind);
  }
}
