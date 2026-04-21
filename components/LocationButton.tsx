"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  tagId: string;
  /** 버튼 문구 (기본: 발견 위치 보내기) */
  actionLabel?: string;
  /** 전송 성공 시 안내 문구 */
  successMessage?: string;
};

function geoErrorMessage(code: number) {
  if (code === 1) return "위치 권한이 거부되었습니다. 브라우저 설정에서 위치를 허용해 주세요.";
  if (code === 2) return "위치를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  if (code === 3) return "시간이 초과되었습니다. 다시 시도해 주세요.";
  return "위치를 가져오지 못했습니다.";
}

export function LocationButton({
  tagId,
  actionLabel = "📍 발견 위치 보내기",
  successMessage = "발견 위치가 보호자에게 전달되었습니다.",
}: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = useCallback(() => {
    setMsg(null);
    setOk(null);
    if (!navigator.geolocation) {
      setMsg("이 기기에서는 위치 공유를 지원하지 않습니다.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch("/api/scan/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tagId, lat, lng }),
          });
          if (res.ok) {
            setOk(successMessage);
          } else {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            setMsg(j.error ?? "전송에 실패했습니다.");
          }
        } catch {
          setMsg("네트워크 오류로 전송하지 못했습니다.");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setMsg(geoErrorMessage(err.code));
      },
      { enableHighAccuracy: true, timeout: 18_000, maximumAge: 0 },
    );
  }, [tagId, successMessage]);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-[56px] w-full text-[16px] font-semibold"
        loading={loading}
        onClick={send}
      >
        {actionLabel}
      </Button>
      {ok ? <p className="text-center text-xs text-emerald-200/90">{ok}</p> : null}
      {msg ? <p className="text-center text-xs text-rose-200/90">{msg}</p> : null}
    </div>
  );
}
