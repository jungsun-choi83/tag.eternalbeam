import { NextRequest, NextResponse } from "next/server";
import { setPetPaid } from "@/lib/pet";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          error:
            "Supabase가 설정되지 않았습니다. 결제 반영을 위해 .env.local에 Supabase 키를 추가하세요.",
        },
        { status: 503 },
      );
    }
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "TOSS_SECRET_KEY is not set" }, { status: 500 });
    }

    const body = await req.json();
    const paymentKey = String(body.paymentKey ?? "");
    const orderId = String(body.orderId ?? "");
    const amount = Number(body.amount);
    const expectedTagId =
      typeof body.expectedTagId === "string" && body.expectedTagId ? body.expectedTagId : null;
    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      return NextResponse.json({ error: "paymentKey, orderId, amount are required" }, { status: 400 });
    }

    const expected = Number(process.env.TOSS_PAYMENT_AMOUNT ?? 1000);
    if (amount !== expected) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const auth = Buffer.from(`${secretKey}:`).toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossJson = await tossRes.json().catch(() => ({}));
    if (!tossRes.ok) {
      return NextResponse.json(
        { error: tossJson?.message ?? "Toss confirm failed", code: tossJson?.code },
        { status: 400 },
      );
    }

    const metaTag = tossJson?.metadata?.tagId;
    const tagFromOrder = parseTagFromOrderId(orderId);
    const tagId =
      typeof metaTag === "string" && metaTag.trim()
        ? metaTag.trim()
        : tagFromOrder;
    if (!tagId) {
      return NextResponse.json({ error: "Could not resolve tagId from payment" }, { status: 400 });
    }
    if (expectedTagId && expectedTagId !== tagId) {
      return NextResponse.json({ error: "Tag mismatch" }, { status: 400 });
    }

    const { error } = await setPetPaid(tagId, true);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, tagId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseTagFromOrderId(orderId: string): string | null {
  const parts = orderId.split(".");
  if (parts.length < 3 || parts[0] !== "pet") return null;
  const enc = parts[1];
  try {
    return Buffer.from(enc, "base64url").toString("utf8");
  } catch {
    return null;
  }
}
