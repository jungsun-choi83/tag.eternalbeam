"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CardBackgroundGrid } from "@/components/CardBackgroundGrid";
import { GenerateButton } from "@/components/GenerateButton";
import { ImageUploader } from "@/components/ImageUploader";
import { PaymentButton } from "@/components/PaymentButton";
import { PetCanvasCompositor, type PetCanvasCompositorHandle } from "@/components/PetCanvasCompositor";
import { ScaleSlider } from "@/components/ScaleSlider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  clampComposite,
  DEFAULT_PET_COMPOSITE,
  COMPOSITE_LIMITS,
  type PetCompositeTransform,
} from "@/lib/pet-composite-layout";
import type { CardBackgroundParam } from "@/lib/sdxl-prompt";
import { coerceBackgroundType } from "@/lib/sdxl-prompt";
import { getStyleById } from "@/lib/styles";

type LoadingKey = null | "remove" | "composite" | "existing";

type Props = { tagId: string; ownerKey?: string | null };

function petStyleToCardParam(s: string | null): CardBackgroundParam {
  const v = String(s ?? "beach").toLowerCase();
  if (v === "spring") return "cherry";
  if (v === "cherry" || v === "beach" || v === "sky" || v === "sunset") return v;
  return "beach";
}

export function CardWorkspace({ tagId, ownerKey }: Props) {
  const compositeRef = useRef<PetCanvasCompositorHandle>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [cutoutImage, setCutoutImage] = useState<string | null>(null);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<CardBackgroundParam>("beach");
  const [composite, setComposite] = useState<PetCompositeTransform>(DEFAULT_PET_COMPOSITE);

  const [loading, setLoading] = useState<LoadingKey>(null);
  const [err, setErr] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);

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
        setUploadedImage(p.raw_image_url ?? p.image_url ?? null);
        setCutoutImage(p.cutout_url ?? null);
        setFinalImageUrl(p.final_image_url ?? null);
        if (p.style) setSelectedBackground(petStyleToCardParam(p.style));
        setComposite(DEFAULT_PET_COMPOSITE);
      } catch {
        /* ignore */
      }
    })();
  }, [tagId]);

  const saveDraft = useCallback(
    async (paid: boolean) => {
      const res = await fetch("/api/pet/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId,
          name,
          phone,
          description,
          raw_image_url: uploadedImage,
          cutout_url: cutoutImage,
          final_image_url: finalImageUrl,
          style: selectedBackground,
          paid,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { error?: string })?.error ?? "저장에 실패했습니다.");
    },
    [cutoutImage, description, finalImageUrl, name, phone, selectedBackground, tagId, uploadedImage],
  );

  function formatApiError(prefix: string, data: Record<string, unknown>) {
    const parts = [data?.error, data?.detail, data?.hint].filter(
      (x): x is string => typeof x === "string" && x.length > 0,
    );
    return parts.length ? parts.join(" — ") : prefix;
  }

  async function onRemoveBg(file: File) {
    setErr(null);
    setLoading("remove");
    setFinalImageUrl(null);
    setComposite(DEFAULT_PET_COMPOSITE);
    try {
      const tryApi = new FormData();
      tryApi.append("raw", file);
      tryApi.append("tagId", tagId);
      const rb = await fetch("/api/pet/remove-bg", { method: "POST", body: tryApi });
      const jd = (await rb.json().catch(() => ({}))) as Record<string, unknown>;
      if (rb.ok) {
        setUploadedImage(jd.rawImageUrl != null ? String(jd.rawImageUrl) : null);
        setCutoutImage(jd.cutoutUrl != null ? String(jd.cutoutUrl) : null);
        return;
      }

      const fallback = jd.fallback === true || rb.status === 501;
      if (!fallback) {
        throw new Error(formatApiError("누끼 처리 실패", jd));
      }

      const { removeBackground } = await import("@imgly/background-removal");
      const cutoutBlob = await removeBackground(file, {
        model: "isnet_quint8",
        output: { format: "image/png" },
      });
      if (!(cutoutBlob instanceof Blob)) {
        throw new Error("누끼 결과를 만들지 못했습니다.");
      }

      const fd = new FormData();
      fd.append("raw", file);
      fd.append("cutout", cutoutBlob, "cutout.png");
      fd.append("tagId", tagId);
      const res = await fetch("/api/pet/upload-images", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error(formatApiError("이미지 업로드 실패", data));
      }
      setUploadedImage(data.rawImageUrl != null ? String(data.rawImageUrl) : null);
      setCutoutImage(data.cutoutUrl != null ? String(data.cutoutUrl) : null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(null);
    }
  }

  async function applyRegisteredPhoto() {
    setErr(null);
    setLoading("existing");
    setFinalImageUrl(null);
    setComposite(DEFAULT_PET_COMPOSITE);
    try {
      const res = await fetch(`/api/pet?tagId=${encodeURIComponent(tagId)}`);
      const data = await res.json();
      const p = data.pet;
      if (!p) throw new Error("프로필을 불러오지 못했습니다.");

      const raw = (p.raw_image_url ?? p.image_url) as string | null;
      const cut = (p.cutout_url ?? null) as string | null;

      if (cut && raw) {
        setUploadedImage(String(raw));
        setCutoutImage(String(cut));
        return;
      }
      if (!raw) throw new Error("등록된 대표 사진이 없습니다. 새 사진을 올려 주세요.");

      const imgRes = await fetch(raw);
      if (!imgRes.ok) throw new Error("대표 사진을 불러오지 못했습니다.");
      const blob = await imgRes.blob();
      const file = new File([blob], "registered.jpg", { type: blob.type || "image/jpeg" });
      await onRemoveBg(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(null);
    }
  }

  async function onCompositeAndSave() {
    if (!cutoutImage) {
      setErr("먼저 누끼 추출이 완료된 사진이 필요합니다.");
      return;
    }
    setErr(null);
    setLoading("composite");
    try {
      const dataUrl = await compositeRef.current?.exportPngDataUrl();
      if (!dataUrl) throw new Error("캔버스에서 이미지를 보내지 못했습니다.");

      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("tagId", tagId);
      fd.append("file", blob, "composite.png");
      const res = await fetch("/api/pet/publish-composite", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) throw new Error(formatApiError("합성 저장 실패", json));
      const url = json.imageUrl != null ? String(json.imageUrl) : null;
      if (!url) throw new Error("저장 응답에 imageUrl이 없습니다.");
      setFinalImageUrl(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "오류");
    } finally {
      setLoading(null);
    }
  }

  function onRegenerate() {
    setFinalImageUrl(null);
  }

  const setComp = useCallback((next: Partial<PetCompositeTransform>) => {
    setComposite((prev) => clampComposite({ ...prev, ...next }));
  }, []);

  const busy = loading !== null;
  const style = getStyleById(coerceBackgroundType(selectedBackground));

  return (
    <main className="animate-fade-in space-y-6 pb-12">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent-a)]">
            Eternal Beam
          </p>
          <h1 className="mt-2 text-2xl font-light tracking-tight text-white">인식표 사진 꾸미기</h1>
          <p className="mt-2 max-w-[380px] text-[15px] leading-relaxed text-[var(--muted)]">
            계절과 순간에 맞게, 우리 아이의 특별한 사진을 만들어보세요
          </p>
        </div>
        <Link
          href={
            ownerKey
              ? `/tag/${encodeURIComponent(tagId)}?owner=${encodeURIComponent(ownerKey)}`
              : `/tag/${encodeURIComponent(tagId)}`
          }
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
      {payErr ? (
        <div className="rounded-2xl border border-rose-400/35 bg-rose-500/[0.12] px-4 py-3 text-sm text-rose-100">
          {payErr}
        </div>
      ) : null}

      <Card className="animate-fade-in-delay space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            className="sm:flex-1"
            loading={loading === "existing"}
            disabled={busy && loading !== "existing"}
            onClick={() => void applyRegisteredPhoto()}
          >
            기존 등록된 이미지 불러오기
          </Button>
        </div>

        <ImageUploader
          rawUrl={uploadedImage}
          cutoutUrl={cutoutImage}
          isProcessing={loading === "remove"}
          onFile={(f) => void onRemoveBg(f)}
          disabled={busy && loading !== "remove"}
          processingLabel="누끼 추출 중…"
        />

        <CardBackgroundGrid
          value={selectedBackground}
          onChange={setSelectedBackground}
          disabled={busy}
        />

        {cutoutImage ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-center text-[12px] leading-relaxed text-[var(--muted)]">
              강아지는 누끼 그대로 유지됩니다. 배경은 선택한 컨셉 이미지를 깔고, Canvas에서 그림자·색감·라이팅만
              보정합니다. (생성 AI 미사용)
            </p>
            <p className="text-center text-[11px] text-[var(--accent-a)]/90">
              강아지 위를 한 손가락으로 끌면 좌우·위아래로 옮길 수 있어요. 두 손가락으로 벌리면 확대·축소됩니다.
              (노트북은 Ctrl+휠로 크기 조절)
            </p>

            <PetCanvasCompositor
              ref={compositeRef}
              backgroundSrc={style.preview}
              cutoutUrl={cutoutImage}
              transform={composite}
              onTransformChange={(t) => setComposite(t)}
              disabled={busy}
            />

            <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <ScaleSlider
                label="크기 (캔버스 너비의 약 40~65%)"
                value={composite.scale}
                onChange={(v) => setComp({ scale: v })}
                min={COMPOSITE_LIMITS.scaleMin}
                max={COMPOSITE_LIMITS.scaleMax}
                step={0.02}
                suffix={`${Math.round(composite.scale * 100)}%`}
                disabled={busy}
              />
              <ScaleSlider
                label="좌우 위치"
                value={composite.offsetX}
                onChange={(v) => setComp({ offsetX: v })}
                min={COMPOSITE_LIMITS.offsetXMin}
                max={COMPOSITE_LIMITS.offsetXMax}
                step={0.02}
                suffix={composite.offsetX.toFixed(2)}
                disabled={busy}
              />
              <ScaleSlider
                label="상하 위치"
                value={composite.offsetY}
                onChange={(v) => setComp({ offsetY: v })}
                min={COMPOSITE_LIMITS.offsetYMin}
                max={COMPOSITE_LIMITS.offsetYMax}
                step={0.01}
                suffix={composite.offsetY.toFixed(2)}
                disabled={busy}
              />
              <ScaleSlider
                label="회전"
                value={composite.rotation}
                onChange={(v) => setComp({ rotation: v })}
                min={COMPOSITE_LIMITS.rotationMin}
                max={COMPOSITE_LIMITS.rotationMax}
                step={1}
                suffix={`${Math.round(composite.rotation)}°`}
                disabled={busy}
              />
            </div>

            <GenerateButton
              loading={loading === "composite"}
              disabled={busy}
              onClick={() => void onCompositeAndSave()}
            >
              사진 합성 저장
            </GenerateButton>
          </div>
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-[13px] leading-relaxed text-[var(--muted)]">
            사진을 올리거나 등록 이미지를 불러오세요. 누끼가 완료되면 배경을 고르고 합성 미리보기에서 위치를
            조절할 수 있어요.
          </p>
        )}
      </Card>

      {finalImageUrl ? (
        <Card className="animate-fade-in space-y-5">
          <p className="text-center text-[13px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
            합성 결과
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={finalImageUrl}
            alt="합성 결과"
            className="mx-auto w-full max-w-[min(100%,420px)] rounded-2xl border border-white/10 object-contain shadow-[0_8px_40px_rgba(0,0,0,0.45)]"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="sm:flex-1" onClick={onRegenerate}>
              다시 만들기
            </Button>
            <PaymentButton
              tagId={tagId}
              ownerName={name}
              generatedImageUrl={finalImageUrl}
              ownerKey={ownerKey ?? undefined}
              disabled={busy}
              onBeforePay={async () => {
                setPayErr(null);
                if (!name.trim() || !phone.trim()) {
                  throw new Error("보호 정보에 이름·전화번호가 없습니다. 등록 페이지에서 먼저 입력해 주세요.");
                }
                await saveDraft(false);
              }}
              onPayError={(e) => {
                const msg = e instanceof Error ? e.message : "결제를 시작하지 못했습니다.";
                if (!msg.includes("사용자")) setPayErr(msg);
              }}
            />
          </div>
          <p className="text-center text-xs text-[var(--muted)]">
            마음에 드시면 아크릴 카드로 제작해 보세요. 유료 제작으로 이어집니다.
          </p>
        </Card>
      ) : null}

      <p className="text-center text-xs text-[var(--muted)]">
        <Link
          href={
            ownerKey
              ? `/tag/${encodeURIComponent(tagId)}/register?owner=${encodeURIComponent(ownerKey)}`
              : `/tag/${encodeURIComponent(tagId)}/register`
          }
          className="text-[var(--accent-a)] underline underline-offset-4"
        >
          보호 정보 수정
        </Link>
      </p>
    </main>
  );
}
