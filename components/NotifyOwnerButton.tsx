"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function NotifyOwnerButton({ tagId }: { tagId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function notify() {
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/scan/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, kind: "notify" }),
      });
      if (res.ok) setMsg("알림 요청이 기록되었습니다.");
      else setMsg("기록에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" loading={loading} onClick={() => void notify()}>
        보호자에게 알리기
      </Button>
      {msg ? <p className="text-center text-xs text-[var(--muted)]">{msg}</p> : null}
    </div>
  );
}
