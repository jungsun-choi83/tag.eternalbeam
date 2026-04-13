import { NextRequest, NextResponse } from "next/server";
import { generateOwnerKey } from "@/lib/owner-key";
import { getPet, upsertPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** 보호 정보 등록만 (카드/누끼 필드는 건드리지 않음) */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }

    const body = await req.json();
    const tagId = String(body.tagId ?? "");
    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const description = String(body.description ?? "").trim();
    const imageUrl = body.image_url != null ? String(body.image_url).trim() : "";
    const notifyOnScan = Boolean(body.notify_on_scan);
    const bodyOwnerKey = body.ownerKey != null ? String(body.ownerKey).trim() : "";

    if (!name || !phone) {
      return NextResponse.json({ error: "이름과 전화번호는 필수입니다." }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: "대표 사진을 올려주세요." }, { status: 400 });
    }

    const existing = await getPet(tagId);

    let nextOwnerKey: string | null = null;
    if (isPetRegistered(existing)) {
      if (existing.owner_key) {
        if (bodyOwnerKey !== existing.owner_key) {
          return NextResponse.json(
            { error: "보호 정보를 수정하려면 견주 관리 링크로 접속해 주세요." },
            { status: 403 },
          );
        }
        nextOwnerKey = existing.owner_key;
      } else {
        nextOwnerKey = generateOwnerKey();
      }
    } else {
      nextOwnerKey = generateOwnerKey();
    }

    const payload: Record<string, unknown> = {
      name,
      phone,
      description,
      image_url: imageUrl,
      raw_image_url: imageUrl,
      notify_on_scan: notifyOnScan,
      owner_key: nextOwnerKey,
    };
    if (!existing?.paid) {
      payload.paid = false;
    }

    let { error } = await upsertPet(tagId, payload);

    /** DB에 owner_key 컬럼만 아직 없을 때: 나머지 필드는 유지하고 owner_key만 빼고 재시도 */
    if (error && isMissingOwnerKeyColumnError(error.message)) {
      const { owner_key: _drop, ...withoutOwnerKey } = payload;
      void _drop;
      const retry = await upsertPet(tagId, withoutOwnerKey);
      error = retry.error;
    }

    /** 구 DB에 image_url / notify_on_scan 컬럼이 없을 때 */
    if (error && isLikelyMissingColumn(error.message)) {
      const legacy: Record<string, unknown> = {
        name,
        phone,
        description,
        raw_image_url: imageUrl,
      };
      if (!existing?.paid) {
        legacy.paid = false;
      }
      const second = await upsertPet(tagId, legacy);
      error = second.error;
    }

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          hint: registerErrorHint(error.message),
        },
        { status: 500 },
      );
    }

    const saved = await getPet(tagId);
    const persistedOwnerKey = saved?.owner_key ?? null;
    return NextResponse.json({
      ok: true,
      /** DB에 owner_key 컬럼이 있을 때만 값이 있습니다. 없으면 견주 전용 URL은 아직 쓸 수 없습니다. */
      ownerKey: persistedOwnerKey,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function isMissingOwnerKeyColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("owner_key") && (m.includes("column") || m.includes("schema cache"));
}

function isLikelyMissingColumn(message: string): boolean {
  const m = message.toLowerCase();
  /** owner_key 누락은 위에서 전용 재시도함 */
  if (m.includes("owner_key")) return false;
  /** "could not find the '…' column of 'pets' in the schema cache" → 컬럼 폴백 허용 */
  if (m.includes("column of") && m.includes("schema cache")) return true;
  /** 테이블 자체가 없을 때는 컬럼 폴백으로 해결되지 않음 */
  if (m.includes("schema cache") && m.includes("could not find") && !m.includes("column of")) {
    return false;
  }
  return (
    m.includes("image_url") ||
    m.includes("notify_on_scan") ||
    (m.includes("column") && m.includes("does not exist"))
  );
}

function registerErrorHint(message: string): string | undefined {
  const m = message.toLowerCase();
  if (
    m.includes("permission denied") ||
    m.includes("rls") ||
    m.includes("row-level security") ||
    m.includes("jwt")
  ) {
    return "`.env.local`에 SUPABASE_SERVICE_ROLE_KEY(service_role)를 넣었는지 확인하세요. anon만 쓰면 pets RLS에 막힐 수 있습니다.";
  }
  if (m.includes("schema cache") && (m.includes("table") || m.includes("could not find"))) {
    return "SQL이 이 프로젝트에 적용됐는지, NEXT_PUBLIC_SUPABASE_URL이 같은 프로젝트인지 확인하세요. Dashboard → Table Editor에 pets가 보여야 합니다.";
  }
  return undefined;
}
