import { NextRequest, NextResponse } from "next/server";
import { generateOwnerKey } from "@/lib/owner-key";
import { getPet, upsertPet } from "@/lib/pet";
import { isPetRegistered } from "@/lib/pet-helpers";
import { normalizeImageMime, resolveProfileImageUrl } from "@/lib/resolve-profile-image";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { isStorageNetworkError } from "@/lib/supabase-storage";

export const runtime = "nodejs";
export const maxDuration = 60;

type RegisterInput = {
  tagId: string;
  name: string;
  phone: string;
  description: string;
  ownerName: string;
  imageUrl: string;
  notifyOnScan: boolean;
  bodyOwnerKey: string;
};

async function parseRegisterInput(req: NextRequest): Promise<RegisterInput | NextResponse> {
  const bucket = process.env.SUPABASE_PET_BUCKET ?? "pet-assets";
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const tagId = String(form.get("tagId") ?? "").trim();
    const name = String(form.get("petName") ?? form.get("name") ?? "").trim();
    const phone = String(form.get("ownerPhone") ?? form.get("phone") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const ownerName = String(form.get("ownerName") ?? "").trim();
    const notifyOnScan = String(form.get("notify_on_scan") ?? "") === "true";
    const bodyOwnerKey = String(form.get("ownerKey") ?? "").trim();
    const existingImage = String(form.get("petImage") ?? "").trim();
    const file = form.get("file");

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }

    let imageUrl = existingImage;
    if (file instanceof Blob && file.size > 0) {
      const buf = Buffer.from(await file.arrayBuffer());
      const mime = normalizeImageMime((file as File).type || "image/jpeg");
      try {
        const resolved = await resolveProfileImageUrl({ tagId, buf, mime, bucket });
        imageUrl = resolved.imageUrl;
      } catch (e) {
        const message = e instanceof Error ? e.message : "업로드 실패";
        return NextResponse.json(
          {
            error: "사진 처리 실패",
            detail: message,
            hint: isStorageNetworkError(message)
              ? "Supabase Storage·DB 연결을 Vercel 환경 변수에서 확인해 주세요."
              : undefined,
          },
          { status: 500 },
        );
      }
    }

    return { tagId, name, phone, description, ownerName, imageUrl, notifyOnScan, bodyOwnerKey };
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다. 사진이 크면 다시 업로드해 주세요." },
      { status: 400 },
    );
  }

  return {
    tagId: String(body.tagId ?? "").trim(),
    name: String(body.petName ?? body.name ?? "").trim(),
    phone: String(body.ownerPhone ?? body.phone ?? "").trim(),
    description: String(body.description ?? "").trim(),
    ownerName: String(body.ownerName ?? "").trim(),
    imageUrl: String(body.petImage ?? body.image_url ?? "").trim(),
    notifyOnScan: Boolean(body.notify_on_scan),
    bodyOwnerKey: body.ownerKey != null ? String(body.ownerKey).trim() : "",
  };
}

/** 보호 정보 등록만 (카드/누끼 필드는 건드리지 않음) */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase가 설정되지 않았습니다." }, { status: 503 });
    }

    const parsed = await parseRegisterInput(req);
    if (parsed instanceof NextResponse) return parsed;

    const { tagId, name, phone, description, ownerName, imageUrl, notifyOnScan, bodyOwnerKey } =
      parsed;

    if (!tagId) {
      return NextResponse.json({ error: "tagId is required" }, { status: 400 });
    }
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

    const isInlineImage = imageUrl.startsWith("data:");
    const payload: Record<string, unknown> = {
      name,
      phone,
      description,
      raw_image_url: imageUrl,
      notify_on_scan: notifyOnScan,
      owner_key: nextOwnerKey,
      owner_name: ownerName || null,
    };
    if (!isInlineImage) {
      payload.image_url = imageUrl;
    } else if (existing?.image_url && !String(existing.image_url).startsWith("data:")) {
      payload.image_url = existing.image_url;
    }
    if (!existing?.paid) {
      payload.paid = false;
    }

    let { error } = await upsertPet(tagId, payload);

    if (error && isMissingOwnerKeyColumnError(error.message)) {
      const { owner_key: _drop, ...withoutOwnerKey } = payload;
      void _drop;
      const retry = await upsertPet(tagId, withoutOwnerKey);
      error = retry.error;
    }

    if (error && isMissingOwnerNameColumnError(error.message)) {
      const { owner_name: _on, ...withoutOwnerName } = payload;
      void _on;
      const retry = await upsertPet(tagId, withoutOwnerName);
      error = retry.error;
    }

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
    const persistedOwnerKey = saved?.owner_key ?? nextOwnerKey;
    return NextResponse.json({
      ok: true,
      ownerKey: persistedOwnerKey,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      {
        error: message,
        hint: isStorageNetworkError(message)
          ? "Supabase DB 연결 실패입니다. Vercel의 NEXT_PUBLIC_SUPABASE_URL·SUPABASE_SERVICE_ROLE_KEY를 확인하고 Redeploy하세요."
          : undefined,
      },
      { status: 500 },
    );
  }
}

function isMissingOwnerKeyColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("owner_key") && (m.includes("column") || m.includes("schema cache"));
}

function isMissingOwnerNameColumnError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes("owner_name") && (m.includes("column") || m.includes("schema cache"));
}

function isLikelyMissingColumn(message: string): boolean {
  const m = message.toLowerCase();
  if (m.includes("owner_key")) return false;
  if (m.includes("owner_name")) return false;
  if (m.includes("column of") && m.includes("schema cache")) return true;
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
  if (isStorageNetworkError(message)) {
    return "Supabase 프로젝트가 Paused 상태가 아닌지, Vercel 환경 변수가 같은 프로젝트를 가리키는지 확인하세요.";
  }
  if (
    m.includes("permission denied") ||
    m.includes("rls") ||
    m.includes("row-level security") ||
    m.includes("jwt")
  ) {
    return "SUPABASE_SERVICE_ROLE_KEY(service_role)가 Vercel에 설정돼 있는지 확인하세요.";
  }
  if (m.includes("schema cache") && (m.includes("table") || m.includes("could not find"))) {
    return "Supabase SQL Editor에서 pets 테이블·컬럼을 적용했는지 확인하세요.";
  }
  return undefined;
}
