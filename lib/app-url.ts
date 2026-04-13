/**
 * 결제 리다이렉트 등 절대 URL 생성용.
 * 프로덕션에서는 `NEXT_PUBLIC_APP_URL=https://tag.eternalbeam.com` 을 Vercel에 설정하는 것을 권장합니다.
 */
export function getBaseUrl() {
  const stripSlash = (s: string) => s.replace(/\/$/, "");

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return stripSlash(fromEnv);

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    const withProto = production.startsWith("http") ? production : `https://${production}`;
    return stripSlash(withProto);
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return stripSlash(`https://${vercel.replace(/^https?:\/\//, "")}`);

  return "http://localhost:3000";
}
