import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/app-url";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
    if (!clientKey) {
      return NextResponse.json({ error: "NEXT_PUBLIC_TOSS_CLIENT_KEY is not set" }, { status: 500 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const amount = Number(process.env.TOSS_PAYMENT_AMOUNT ?? 1000);
    const orderName = String(body.orderName ?? "아크릴 카드 제작");
    const orderId = `pet_${randomUUID().replace(/-/g, "")}`;

    const base = getBaseUrl();
    const returnFlow = String(body.returnFlow ?? "card");
    const ownerKey = body.ownerKey != null ? String(body.ownerKey).trim() : "";
    const ownerQs = ownerKey ? `&owner=${encodeURIComponent(ownerKey)}` : "";
    const ownerPath = ownerKey ? `?owner=${encodeURIComponent(ownerKey)}` : "";
    const successUrl = `${base}/tag/${encodeURIComponent(tagId)}?paid=1${ownerQs}`;
    const failUrl =
      returnFlow === "card"
        ? `${base}/tag/${encodeURIComponent(tagId)}/card${ownerPath}`
        : `${base}/tag/${encodeURIComponent(tagId)}/register${ownerPath}`;

    return NextResponse.json({
      clientKey,
      orderId,
      amount,
      orderName,
      successUrl,
      failUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
