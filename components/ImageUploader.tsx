"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  rawUrl: string | null;
  cutoutUrl: string | null;
  isProcessing: boolean;
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Live preview scale for cutout (1 = 기본). */
  cutoutPreviewScale?: number;
  processingLabel?: string;
};

export function ImageUploader({
  rawUrl,
  cutoutUrl,
  isProcessing,
  onFile,
  disabled,
  cutoutPreviewScale = 1,
  processingLabel = "AI로 누끼 추출 중…",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    if (rawUrl && localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  }, [rawUrl, localPreview]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const f = files?.[0];
      if (!f || !f.type.startsWith("image/") || disabled || isProcessing) return;
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(f);
      });
      onFile(f);
    },
    [disabled, isProcessing, onFile],
  );

  const displayRaw = rawUrl ?? localPreview;

  return (
    <div className="space-y-3">
      <span className="text-[13px] font-medium text-[var(--muted)]">사진</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || isProcessing}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group relative flex min-h-[200px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 transition ${
          drag
            ? "scale-[1.02] border-[var(--accent-a)]/70 bg-[var(--accent-a)]/10 shadow-[0_0_28px_rgba(124,140,255,0.2)]"
            : "border-white/18 bg-black/20 hover:border-[var(--accent-a)]/45 hover:bg-white/[0.04]"
        } disabled:opacity-45`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 text-sm text-[var(--muted)]">
            <span
              className="inline-block size-10 rounded-full border-2 border-white/20 border-t-[var(--accent-a)]"
              style={{ animation: "spin 0.75s linear infinite" }}
            />
            {processingLabel}
          </div>
        ) : displayRaw ? (
          <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="animate-fade-in space-y-2">
              <p className="text-center text-xs text-[var(--muted)]">미리보기</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayRaw}
                alt=""
                className="mx-auto max-h-48 w-full max-w-[200px] rounded-xl border border-white/10 object-contain"
              />
            </div>
            <div className="animate-fade-in-delay space-y-2">
              <p className="text-center text-xs text-[var(--muted)]">누끼</p>
              {cutoutUrl ? (
                <div className="mx-auto flex h-48 w-full max-w-[200px] items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d1224]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cutoutUrl}
                    alt=""
                    className="max-h-full max-w-full object-contain transition-transform duration-200"
                    style={{ transform: `scale(${cutoutPreviewScale})` }}
                  />
                </div>
              ) : (
                <p className="flex min-h-[120px] items-center justify-center rounded-xl border border-white/10 bg-black/30 text-center text-xs text-[var(--muted)]">
                  업로드하면 자동 생성
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-full bg-white/8 p-4 transition group-hover:scale-105">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[var(--accent-a)]">
                <path
                  d="M12 5v14M5 12h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[15px] font-medium text-white">탭하여 업로드</p>
              <p className="mt-1 text-sm text-[var(--muted)]">또는 이미지를 여기로 드래그</p>
            </div>
          </>
        )}
      </button>
    </div>
  );
}
