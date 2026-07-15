import "server-only";

import { getSupabaseAdmin } from "./supabase-admin";

function projectUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return raw?.replace(/\/+$/, "");
}

function serviceKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
}

function encodeObjectPath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

export function publicStorageUrl(bucket: string, path: string) {
  const base = projectUrl();
  if (!base) return "";
  return `${base}/storage/v1/object/public/${bucket}/${encodeObjectPath(path)}`;
}

export function isStorageNetworkError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fetch failed") ||
    m.includes("network") ||
    m.includes("econnrefused") ||
    m.includes("enotfound") ||
    m.includes("etimedout") ||
    m.includes("socket")
  );
}

/** Storage 불가 시 등록은 되게 하는 임시 data URL (최대 ~480KB 원본) */
export function bufferToDataUrl(buf: Buffer, mime: string, maxBytes = 480_000): string | null {
  if (buf.length > maxBytes) return null;
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function uploadViaRest(params: {
  bucket: string;
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const base = projectUrl();
  const key = serviceKey();
  if (!base || !key) return { ok: false, message: "Supabase URL 또는 키가 없습니다." };

  const objectPath = encodeObjectPath(params.path);
  const endpoint = `${base}/storage/v1/object/${params.bucket}/${objectPath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": params.contentType,
    "Cache-Control": "3600",
  };
  if (params.upsert !== false) headers["x-upsert"] = "true";

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: new Uint8Array(params.body),
    cache: "no-store",
  });
  if (res.ok) {
    return { ok: true, publicUrl: publicStorageUrl(params.bucket, params.path) };
  }
  const text = (await res.text()).trim();
  let detail = text;
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    detail = json.message ?? json.error ?? text;
  } catch {
    /* plain */
  }
  return { ok: false, message: detail || `HTTP ${res.status}` };
}

async function uploadViaSdk(params: {
  bucket: string;
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.storage.from(params.bucket).upload(params.path, params.body, {
      contentType: params.contentType,
      upsert: params.upsert !== false,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, publicUrl: publicStorageUrl(params.bucket, params.path) };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "sdk upload failed" };
  }
}

/** REST → SDK 순으로 시도 */
export async function uploadStorageObject(params: {
  bucket: string;
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const base = projectUrl();
  if (!base) return { ok: false, message: "NEXT_PUBLIC_SUPABASE_URL이 없습니다." };
  if (!/^https:\/\/.+\.supabase\.co$/i.test(base)) {
    return { ok: false, message: `NEXT_PUBLIC_SUPABASE_URL 형식 오류: ${base}` };
  }

  const strategies = [uploadViaRest, uploadViaSdk];
  let lastMessage = "fetch failed";

  for (const strategy of strategies) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await strategy(params);
        if (result.ok) return result;
        lastMessage = result.message;
        if (!isStorageNetworkError(result.message)) return result;
      } catch (e) {
        lastMessage = e instanceof Error ? e.message : "fetch failed";
      }
      if (attempt === 0) await new Promise((r) => setTimeout(r, 350));
    }
  }

  return { ok: false, message: lastMessage };
}

export async function probeSupabaseReachability(): Promise<{
  url: string | null;
  hasServiceKey: boolean;
  storageOk: boolean;
  restOk: boolean;
  detail?: string;
}> {
  const base = projectUrl() ?? null;
  const key = serviceKey();
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  if (!base || !key) {
    return { url: base, hasServiceKey, storageOk: false, restOk: false, detail: "env missing" };
  }

  let storageOk = false;
  let restOk = false;
  let detail: string | undefined;

  try {
    const r = await fetch(`${base}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    storageOk = r.ok || r.status === 200 || r.status === 404;
  } catch (e) {
    detail = `storage: ${e instanceof Error ? e.message : "fail"}`;
  }

  try {
    const r = await fetch(`${base}/rest/v1/`, {
      headers: { Authorization: `Bearer ${key}`, apikey: key },
      cache: "no-store",
    });
    restOk = r.ok || r.status === 200;
  } catch (e) {
    detail = [detail, `rest: ${e instanceof Error ? e.message : "fail"}`].filter(Boolean).join("; ");
  }

  return { url: base, hasServiceKey, storageOk, restOk, detail };
}
