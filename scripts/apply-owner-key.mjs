/**
 * Supabase Postgres에 owner_key 컬럼을 적용합니다.
 *
 * 사용: Supabase 대시보드 → Project Settings → Database → Connection string
 *       에서 URI를 복사해 .env.local에 다음을 넣은 뒤 실행하세요.
 *
 *   DATABASE_URL=postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-....pooler.supabase.com:6543/postgres
 *
 *   (Transaction pooler 권장. 비밀번호는 대시보드에서 설정한 DB 비밀번호입니다.)
 *
 *   npm run db:apply-owner-key
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error(
    "DATABASE_URL이 없습니다. Supabase → Settings → Database → Connection string (URI)를\n" +
      ".env.local에 DATABASE_URL=... 로 추가한 뒤 다시 실행하세요.",
  );
  process.exit(1);
}

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260413120000_add_pets_owner_key.sql"),
  "utf8",
);

const client = new pg.Client({ connectionString: url });
try {
  await client.connect();
  await client.query(sql);
  console.log("적용 완료: public.pets.owner_key + PostgREST reload 알림");
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
