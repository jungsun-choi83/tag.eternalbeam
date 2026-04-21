"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = globalThis.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type Props = {
  tagId: string;
  ownerKey: string;
  vapidPublicKey: string | null;
};

/**
 * 견주 전용: 브라우저 푸시 구독 (문자/SMS 비용 없음)
 */
export function OwnerWebPushSubscribe({ tagId, ownerKey, vapidPublicKey }: Props) {
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"unknown" | "off" | "on" | "denied">("unknown");

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window,
    );
  }, []);

  useEffect(() => {
    if (!supported || !vapidPublicKey) return;
    let cancelled = false;
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        if (cancelled) return;
        if (Notification.permission === "denied") {
          setState("denied");
          return;
        }
        setState(sub ? "on" : "off");
      } catch {
        if (!cancelled) setState("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supported, vapidPublicKey]);

  const subscribe = useCallback(async () => {
    if (!vapidPublicKey) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm === "denied") {
        setState("denied");
        return;
      }
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.register("/eb-sw.js");
      await reg.update();
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(urlBase64ToUint8Array(vapidPublicKey)) as BufferSource,
      });
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId, ownerKey, subscription: json }),
      });
      setState(res.ok ? "on" : "off");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }, [tagId, ownerKey, vapidPublicKey]);

  if (!vapidPublicKey || !supported) return null;

  return (
    <div className="rounded-2xl border border-[#d4af37]/14 bg-[#0c0c0a]/70 px-4 py-4">
      <p className="text-[13px] font-medium text-[#e8dcc8]">브라우저 알림 (무료)</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[#6e685e]">
        QR가 열리거나 발견자가 알릴 때, 이 기기에서만 알려드려요. 문자 요금은 없습니다.
      </p>
      {state === "on" ? (
        <p className="mt-3 text-center text-[12px] text-emerald-200/85">알림이 켜져 있어요</p>
      ) : state === "denied" ? (
        <p className="mt-3 text-center text-[12px] text-amber-200/85">브라우저 설정에서 알림을 허용해 주세요</p>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void subscribe()}
          className="mt-3 flex w-full min-h-[44px] items-center justify-center rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/[0.07] text-[13px] text-[#f0e6c8] transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/12 disabled:opacity-50"
        >
          {busy ? "연결 중…" : "이 기기에서 알림 받기"}
        </button>
      )}
    </div>
  );
}
