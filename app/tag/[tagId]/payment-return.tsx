"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PaymentReturnHandler({ tagId, ownerKey }: { tagId: string; ownerKey?: string }) {
  const search = useSearchParams();
  const router = useRouter();
  const ran = useRef(false);
  const [msg, setMsg] = useState<string | null>(null);

  const paymentKey = search.get("paymentKey");
  const orderId = search.get("orderId");
  const amountStr = search.get("amount");

  useEffect(() => {
    if (!paymentKey || !orderId || !amountStr) return;
    if (ran.current) return;
    ran.current = true;

    (async () => {
      setMsg("결제를 확인하는 중입니다…");
      const res = await fetch("/api/toss/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amountStr),
          expectedTagId: tagId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body?.error ?? "결제 확인에 실패했습니다.");
        return;
      }
      setMsg(null);
      const ownerQs = ownerKey ? `?owner=${encodeURIComponent(ownerKey)}` : "";
      router.replace(`/tag/${encodeURIComponent(tagId)}${ownerQs}`);
    })();
  }, [amountStr, orderId, ownerKey, paymentKey, router, tagId]);

  if (!msg) return null;
  return (
    <div className="glass-card border-amber-400/35 bg-amber-500/[0.12] px-4 py-3 text-center text-sm text-amber-100">
      {msg}
    </div>
  );
}
