"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = { tagId: string };

export function PhotoUpload({ tagId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onPick = useCallback(() => {
    setMsg(null);
    setOk(null);
    inputRef.current?.click();
  }, []);

  const onChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setMsg(null);
      setOk(null);
      setLoading(true);
      try {
        const fd = new FormData();
        fd.append("tagId", tagId);
        fd.append("file", file);
        const res = await fetch("/api/scan/photo", { method: "POST", body: fd });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (res.ok && j.ok) {
          setOk("사진이 전달되었습니다. 감사합니다.");
        } else {
          setMsg(j.error ?? "업로드에 실패했습니다.");
        }
      } catch {
        setMsg("네트워크 오류로 업로드하지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [tagId],
  );

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onChange(e)}
      />
      <Button
        type="button"
        variant="outline"
        className="min-h-[56px] w-full text-[16px] font-semibold"
        loading={loading}
        onClick={onPick}
      >
        📸 사진 보내기
      </Button>
      {ok ? <p className="text-center text-xs text-emerald-200/90">{ok}</p> : null}
      {msg ? <p className="text-center text-xs text-rose-200/90">{msg}</p> : null}
    </div>
  );
}
