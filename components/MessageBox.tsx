"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = { tagId: string };

export function MessageBox({ tagId }: Props) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMsg(null);
      setOk(null);
      const body = text.trim();
      if (!body) {
        setMsg("메시지를 입력해 주세요.");
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/scan/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId, body }),
        });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (res.ok && j.ok) {
          setOk("메시지가 전달되었습니다.");
          setText("");
        } else {
          setMsg(j.error ?? "전송에 실패했습니다.");
        }
      } catch {
        setMsg("네트워크 오류로 전송하지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [tagId, text],
  );

  return (
    <form className="space-y-3" onSubmit={(e) => void submit(e)}>
      <label className="block text-xs font-medium text-[var(--muted)]" htmlFor={`finder-msg-${tagId}`}>
        짧은 메모 (상황, 주변 건물 등)
      </label>
      <textarea
        id={`finder-msg-${tagId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={800}
        placeholder="예: ○○공원 근처에서 발견했어요"
        className="w-full resize-none rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-[15px] leading-relaxed text-white placeholder:text-white/35 focus:border-[var(--accent-a)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent-a)]/30"
        disabled={loading}
      />
      <Button
        type="submit"
        variant="outline"
        className="min-h-[56px] w-full text-[16px] font-semibold"
        loading={loading}
      >
        💬 메시지 보내기
      </Button>
      {ok ? <p className="text-center text-xs text-emerald-200/90">{ok}</p> : null}
      {msg ? <p className="text-center text-xs text-rose-200/90">{msg}</p> : null}
    </form>
  );
}
