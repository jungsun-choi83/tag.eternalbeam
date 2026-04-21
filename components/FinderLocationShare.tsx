"use client";

import { useCallback, useState } from "react";

type Props = {
  tagId: string;
  /** sms: / 공유 시 함께 보낼 보호자 번호 (하이픈 제거 권장) */
  ownerPhoneDigits: string;
};

function mapsLink(lat: number, lng: number) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function buildMessage(lat: number, lng: number) {
  return `여기에서 발견했어요: ${mapsLink(lat, lng)}`;
}

export function FinderLocationShare({ tagId, ownerPhoneDigits }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const share = useCallback(async () => {
    setMsg(null);
    if (!navigator.geolocation) {
      setMsg("이 기기에서는 위치를 쓸 수 없어요.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const text = buildMessage(lat, lng);
        try {
          void fetch("/api/scan/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagId, lat, lng }),
          });
        } catch {
          /* 기록 실패해도 공유는 진행 */
        }

        try {
          if (typeof navigator !== "undefined" && navigator.share) {
            await navigator.share({ text });
            setLoading(false);
            return;
          }
        } catch {
          /* 사용자 취소 등 */
        }

        const body = encodeURIComponent(text);
        const tel = ownerPhoneDigits.replace(/\s/g, "");
        window.location.href = `sms:${tel}?body=${body}`;
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) setMsg("위치 권한이 필요해요. 설정에서 허용해 주세요.");
        else if (err.code === 2) setMsg("위치를 잡지 못했어요. 잠시 후 다시 시도해 주세요.");
        else if (err.code === 3) setMsg("시간이 조금 부족했어요. 다시 눌러 주세요.");
        else setMsg("위치를 가져오지 못했어요.");
      },
      { enableHighAccuracy: true, timeout: 18_000, maximumAge: 0 },
    );
  }, [ownerPhoneDigits, tagId]);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void share()}
        className="eb-finder-loc flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-3 py-2.5 text-[13px] font-medium text-[#d8d0c4] transition motion-safe:duration-300 disabled:opacity-45"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-4 shrink-0 rounded-full border-2 border-[#d4af37]/30 border-t-[#d4af37]"
              style={{ animation: "spin 0.75s linear infinite" }}
              aria-hidden
            />
            위치 확인 중…
          </span>
        ) : (
          <>
            <span className="text-[15px]">📍 위치 공유하기</span>
            <span className="text-[10px] font-normal text-[#7a7268]">지도 링크를 보내요</span>
          </>
        )}
      </button>
      {msg ? <p className="text-center text-[11px] leading-relaxed text-rose-200/90">{msg}</p> : null}
    </div>
  );
}
