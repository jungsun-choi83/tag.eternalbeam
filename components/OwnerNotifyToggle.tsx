"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/Card";

type Props = {
  tagId: string;
  ownerKey: string;
  initialNotifyOnScan: boolean;
};

export function OwnerNotifyToggle({ tagId, ownerKey, initialNotifyOnScan }: Props) {
  const [on, setOn] = useState(initialNotifyOnScan);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = useCallback(
    async (next: boolean) => {
      setMsg(null);
      setLoading(true);
      try {
        const res = await fetch("/api/pet/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagId, ownerKey, notify_on_scan: next }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(typeof body?.error === "string" ? body.error : "저장에 실패했습니다.");
        }
        setOn(next);
      } catch (e) {
        setMsg(e instanceof Error ? e.message : "오류");
      } finally {
        setLoading(false);
      }
    },
    [ownerKey, tagId],
  );

  return (
    <Card className="space-y-3 border-white/10 px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">QR 스캔 시 알림</p>
          <p className="mt-1 text-xs text-[var(--muted)]">ON이면 스캔 기록이 저장됩니다.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          disabled={loading}
          onClick={() => void save(!on)}
          className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border border-white/15 transition ${
            on ? "bg-[var(--accent-a)]/40" : "bg-white/10"
          }`}
        >
          <span
            className={`absolute top-0.5 size-7 rounded-full bg-white shadow transition ${
              on ? "left-[calc(100%-1.875rem)]" : "left-0.5"
            }`}
          />
        </button>
      </div>
      {msg ? (
        <p className="text-center text-xs text-rose-200">
          {msg}
        </p>
      ) : null}
    </Card>
  );
}
