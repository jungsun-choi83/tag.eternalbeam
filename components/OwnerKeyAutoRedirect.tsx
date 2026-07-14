"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getRememberedOwnerKey } from "@/lib/owner-key-storage";

type Props = { tagId: string };

/**
 * 같은 QR 재스캔 시 이 기기에 저장된 견주 키로 ?owner= 를 붙여 기억 열기 화면으로 이어줍니다.
 */
export function OwnerKeyAutoRedirect({ tagId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("owner")) return;
    const stored = getRememberedOwnerKey(tagId);
    if (!stored) return;
    const encTag = encodeURIComponent(tagId);
    const encOwner = encodeURIComponent(stored);
    router.replace(`/tag/${encTag}?owner=${encOwner}`);
  }, [tagId, searchParams, router]);

  return null;
}
