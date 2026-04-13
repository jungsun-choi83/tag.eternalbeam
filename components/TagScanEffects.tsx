"use client";

import { useEffect, useRef } from "react";

/** 등록된 태그 조회 시, 알림 ON이면 view 스캔 로그를 한 번 기록합니다. */
export function TagScanEffects({ tagId, logView }: { tagId: string; logView: boolean }) {
  const logged = useRef(false);

  useEffect(() => {
    if (!logView || logged.current) return;
    logged.current = true;
    void fetch("/api/scan/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId, kind: "view" }),
    });
  }, [logView, tagId]);

  return null;
}
