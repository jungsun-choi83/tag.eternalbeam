/**
 * Eternal Connect (connect.eternalbeam.com) 이어보기 URL.
 * Connect 쪽에서 `source`, `tagId`, `petName`, (선택) `tagPageUrl` 을 읽어
 * 태그 흐름과 맞물리게 구현하면 됩니다.
 */
export function buildConnectContinueUrl(tagId: string, petName: string): string {
  const baseRaw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_CONNECT_APP_URL?.trim()) ||
    "https://connect.eternalbeam.com";
  const base = baseRaw.replace(/\/$/, "");
  let u: URL;
  try {
    u = new URL(base.includes("://") ? base : `https://${base}`);
  } catch {
    u = new URL("https://connect.eternalbeam.com");
  }

  u.searchParams.set("source", "tag");
  u.searchParams.set("tagId", tagId);
  u.searchParams.set("petName", petName.trim() || "우리 아이");

  const appUrl =
    typeof process !== "undefined" ? process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") : "";
  if (appUrl) {
    u.searchParams.set("tagPageUrl", `${appUrl}/tag/${encodeURIComponent(tagId)}`);
  }

  return u.toString();
}
