"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";

export function RegisterForm({
  tagId,
  ownerKeyForEdit,
}: {
  tagId: string;
  ownerKeyForEdit?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [notifyOnScan, setNotifyOnScan] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pet?tagId=${encodeURIComponent(tagId)}`);
        const data = await res.json();
        const p = data.pet;
        if (!p) return;
        setName(p.name ?? "");
        setPhone(p.phone ?? "");
        setDescription(p.description ?? "");
        setImageUrl(p.image_url ?? p.raw_image_url ?? null);
        setNotifyOnScan(Boolean(p.notify_on_scan));
      } catch {
        /* ignore */
      }
    })();
  }, [tagId]);

  const onSubmit = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/pet/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          name,
          phone,
          description,
          image_url: imageUrl,
          notify_on_scan: notifyOnScan,
          ...(ownerKeyForEdit ? { ownerKey: ownerKeyForEdit } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const parts = [body?.error, body?.hint].filter((x: unknown) => typeof x === "string" && x);
        throw new Error(parts.length ? parts.join(" — ") : "저장에 실패했습니다.");
      }
      const returnedKey = typeof body?.ownerKey === "string" ? body.ownerKey : ownerKeyForEdit;
      const qs = returnedKey ? `?owner=${encodeURIComponent(returnedKey)}` : "";
      router.push(`/tag/${encodeURIComponent(tagId)}${qs}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(false);
    }
  }, [description, imageUrl, name, notifyOnScan, ownerKeyForEdit, phone, router, tagId]);

  return (
    <main className="animate-fade-in space-y-6 pb-12">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent-a)]">
            Eternal Beam
          </p>
          <h1 className="mt-2 text-2xl font-light tracking-tight text-white">우리 아이 보호 정보 등록</h1>
          <p className="mt-2 max-w-[360px] text-[15px] leading-relaxed text-[var(--muted)]">
            혹시 모를 상황을 대비해 연락받을 정보를 남겨주세요
          </p>
        </div>
        <Link
          href={`/tag/${encodeURIComponent(tagId)}`}
          className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/90 transition hover:border-[var(--accent-a)]/50 hover:bg-white/5"
        >
          조회
        </Link>
      </header>

      {err ? (
        <div className="rounded-2xl border border-rose-400/35 bg-rose-500/[0.12] px-4 py-3 text-sm text-rose-100">
          {err}
        </div>
      ) : null}

      <Card className="animate-fade-in-delay space-y-6">
        <Input label="이름" value={name} onChange={(e) => setName(e.target.value)} placeholder="반려견 이름" />
        <Input
          label="전화번호"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01012345678"
          inputMode="tel"
        />
        <Textarea
          label="간단한 메모"
          hint="성격, 알레르기 등 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="발견자에게 전하고 싶은 내용"
        />

        <ProfilePhotoUpload
          tagId={tagId}
          imageUrl={imageUrl}
          onImageUrl={setImageUrl}
          disabled={loading}
        />

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
          <div>
            <p className="text-sm font-medium text-white">QR 스캔 시 알림 받기</p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              ON이면 스캔 기록이 저장됩니다. 이후 SMS·푸시로 확장할 수 있어요.
            </p>
          </div>
          <input
            type="checkbox"
            checked={notifyOnScan}
            onChange={(e) => setNotifyOnScan(e.target.checked)}
            className="size-5 shrink-0 accent-[var(--accent-a)]"
          />
        </label>

        <Button variant="gradient" loading={loading} onClick={() => void onSubmit()}>
          등록 완료
        </Button>
      </Card>
    </main>
  );
}
