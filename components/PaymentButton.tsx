"use client";

import { useState } from "react";
import { ANONYMOUS, loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Button } from "@/components/ui/Button";

type Props = {
  tagId: string;
  ownerName: string;
  generatedImageUrl: string | null;
  /** 결제 완료·실패 후 견주 화면으로 돌아갈 때 URL에 붙입니다. */
  ownerKey?: string | null;
  onBeforePay: () => Promise<void>;
  disabled?: boolean;
  onPayError?: (e: unknown) => void;
};

export function PaymentButton({
  tagId,
  ownerName,
  generatedImageUrl,
  ownerKey,
  onBeforePay,
  disabled,
  onPayError,
}: Props) {
  const [paying, setPaying] = useState(false);

  async function pay() {
    if (!generatedImageUrl) return;
    setPaying(true);
    try {
      await onBeforePay();
      const ck = await fetch("/api/toss/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          orderName: `${ownerName} · 아크릴 카드`,
          returnFlow: "card",
          ...(ownerKey ? { ownerKey } : {}),
        }),
      });
      const checkout = await ck.json();
      if (!ck.ok) throw new Error(checkout?.error ?? "결제 준비 실패");

      const tossPayments = await loadTossPayments(checkout.clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: checkout.amount },
        orderId: checkout.orderId,
        orderName: checkout.orderName,
        successUrl: checkout.successUrl,
        failUrl: checkout.failUrl,
        customerName: ownerName.trim() || "고객",
        metadata: { tagId },
        card: { useEscrow: false, flowMode: "DEFAULT" },
      });
    } catch (e) {
      onPayError?.(e);
    } finally {
      setPaying(false);
    }
  }

  return (
    <Button
      variant="gradient"
      loading={paying}
      disabled={disabled || !generatedImageUrl}
      onClick={() => void pay()}
    >
      아크릴 카드 제작하기
    </Button>
  );
}
