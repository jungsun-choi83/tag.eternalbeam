import "server-only";

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

/** supabase-js storage 대신 REST 업로드 (Vercel에서 fetch failed 완화) */
export async function uploadStorageObject(params: {
  bucket: string;
  path: string;
  body: Buffer;
  contentType: string;
  upsert?: boolean;
}): Promise<{ ok: true; publicUrl: string } | { ok: false; message: string }> {
  const base = projectUrl();
  const key = serviceKey();
  if (!base || !key) {
    return { ok: false, message: "Supabase URL 또는 키가 없습니다." };
  }
  if (!/^https:\/\/.+\.supabase\.co$/i.test(base)) {
    return {
      ok: false,
      message: `NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다: ${base}`,
    };
  }

  const objectPath = encodeObjectPath(params.path);
  const endpoint = `${base}/storage/v1/object/${params.bucket}/${objectPath}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    apikey: key,
    "Content-Type": params.contentType,
    "Cache-Control": "3600",
  };
  if (params.upsert !== false) headers["x-upsert"] = "true";

  let lastMessage = "fetch failed";
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
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
        /* plain text */
      }
      return { ok: false, message: detail || `HTTP ${res.status}` };
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : "fetch failed";
      if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
    }
  }
  return { ok: false, message: lastMessage };
}
