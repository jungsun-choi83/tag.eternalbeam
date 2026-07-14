import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function supabaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return raw?.replace(/\/+$/, "");
}

function supabaseKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseKey());
}

export function getSupabaseAdmin(): SupabaseClient {
  if (_client) return _client;
  const url = supabaseUrl();
  const key = supabaseKey();
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or Supabase key env");
  }
  _client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
