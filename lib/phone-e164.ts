import "server-only";

/**
 * 한국 휴대폰 번호를 Twilio 등에 쓰는 E.164(+82…)로 맞춥니다.
 * 실패 시 null (SMS 생략).
 */
export function phoneToE164Kr(raw: string): string | null {
  const s = raw.replace(/[\s\-().]/g, "");
  if (!s) return null;
  let digits = s.replace(/\D/g, "");
  if (digits.startsWith("82")) {
    digits = digits.slice(2);
  }
  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length < 9 || digits.length > 11) return null;
  if (!/^1\d{7,9}$/.test(digits)) return null;
  return `+82${digits}`;
}
