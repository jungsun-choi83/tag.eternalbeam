"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  tagId: string;
  imageUrl: string | null;
  onImageUrl: (url: string | null) => void;
  disabled?: boolean;
};

export function ProfilePhotoUpload({ tagId, imageUrl, onImageUrl, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (imageUrl && local) {
      URL.revokeObjectURL(local);
      setLocal(null);
    }
  }, [imageUrl, local]);

  useEffect(() => {
    return () => {
      if (local) URL.revokeObjectURL(local);
    };
  }, [local]);

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/") || disabled) return;
      setBusy(true);
      setLocal((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("tagId", tagId);
        const res = await fetch("/api/pet/upload-profile", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error ?? "업로드 실패");
        onImageUrl(String(data.imageUrl ?? ""));
      } catch {
        onImageUrl(null);
      } finally {
        setBusy(false);
      }
    },
    [disabled, onImageUrl, tagId],
  );

  const preview = imageUrl ?? local;

  return (
    <div className="space-y-2">
      <span className="text-[13px] font-medium text-[var(--muted)]">대표 사진</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled || busy}
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
          const f = e.dataTransfer.files?.[0];
          if (f) void upload(f);
        }}
        className={`flex min-h-[180px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 transition ${
          drag
            ? "border-[var(--accent-a)]/70 bg-[var(--accent-a)]/10"
            : "border-white/18 bg-black/20 hover:border-[var(--accent-a)]/45"
        } disabled:opacity-45`}
      >
        {busy ? (
          <span className="text-sm text-[var(--muted)]">업로드 중…</span>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className="max-h-52 w-full max-w-[280px] rounded-xl border border-white/10 object-contain"
          />
        ) : (
          <div className="text-center text-sm text-[var(--muted)]">
            탭하거나 드래그하여 사진 추가
          </div>
        )}
      </button>
    </div>
  );
}
