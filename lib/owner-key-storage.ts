const prefix = "eb-owner:";

function key(tagId: string) {
  return `${prefix}${tagId.trim()}`;
}

/** 이 기기에서 등록·연결한 견주 키 — 같은 QR 재스캔 시 기억 열기용 */
export function rememberOwnerKey(tagId: string, ownerKey: string) {
  if (typeof window === "undefined") return;
  const k = ownerKey.trim();
  if (!k) return;
  try {
    localStorage.setItem(key(tagId), k);
  } catch {
    /* quota / private mode */
  }
}

export function getRememberedOwnerKey(tagId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(key(tagId));
    return v?.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}
