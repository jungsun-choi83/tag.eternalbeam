/** Storage / 로그용 경로 세그먼트 (특수문자 제거). */
export function safeTagPathSegment(tagId: string) {
  const t = tagId.trim() || "anon";
  return t.replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 96) || "tag";
}
