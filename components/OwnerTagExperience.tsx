"use client";

import Link from "next/link";
import { useLayoutEffect } from "react";
import { EternalBeamMark } from "@/components/EternalBeamMark";
import { OwnerWebPushSubscribe } from "@/components/OwnerWebPushSubscribe";
import { buildConnectContinueUrl } from "@/lib/connect-eternalbeam";
import type { OwnerTagSummary } from "@/lib/tag-activity";

type Props = {
  tagId: string;
  ownerKey: string;
  petName: string;
  notifyOnScan: boolean;
  summary: OwnerTagSummary;
  webPushPublicKey: string | null;
};

/** 받침 있으면 '과', 없으면 '와' */
function waGwa(name: string): string {
  const n = name.trim();
  if (!n) return "와";
  const last = n[n.length - 1]!;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "과";
  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return hasBatchim ? "과" : "와";
}

/** 받침 있으면 '을', 없으면 '를' */
function eulReul(name: string): string {
  const n = name.trim();
  if (!n) return "을";
  const last = n[n.length - 1]!;
  const code = last.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return "을";
  const hasBatchim = (code - 0xac00) % 28 !== 0;
  return hasBatchim ? "을" : "를";
}

function StatBubble({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="flex min-h-[100px] flex-1 flex-col justify-between rounded-2xl border border-[#d4af37]/12 bg-[#0c0b0a]/80 px-3 py-3 text-center shadow-[inset_0_1px_0_rgba(255,250,235,0.03)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#7a7268]">{label}</p>
      <p className="my-1.5 text-[28px] font-extralight tabular-nums leading-none text-[#c4a85a]/95">{value}</p>
      <p className="text-[10px] leading-snug text-[#5c574e]">{hint}</p>
    </div>
  );
}

/**
 * 견주 연결 직후 — 관리 페이지가 아니라 이어짐의 시작을 느끼게
 */
export function OwnerTagExperience({
  tagId,
  ownerKey,
  petName,
  notifyOnScan,
  summary,
  webPushPublicKey,
}: Props) {
  const displayName = petName.trim() || "우리 아이";

  /** 등록 폼에서 긴 스크롤 후 이동하면 스크롤이 유지되어 상단 '연결·이어보기'가 안 보일 수 있음 */
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const encTag = encodeURIComponent(tagId);
  const encOwner = encodeURIComponent(ownerKey);
  const regHref = `/tag/${encTag}/register?owner=${encOwner}`;
  const particle = waGwa(displayName);
  const continueHref = buildConnectContinueUrl(tagId, displayName);

  const heartTotal = summary.messageCount + summary.photoCount;

  return (
    <div className="space-y-12 pb-20 pt-4">
      <div className="flex justify-center pb-2">
        <EternalBeamMark />
      </div>

      {/* — 감정 상단 — */}
      <header className="text-center">
        <h1 className="text-[clamp(1.45rem,5.5vw,1.85rem)] font-light leading-[1.45] tracking-[-0.02em] text-[#faf6ef]">
          <span className="text-[#e8d5a3]">{displayName}</span>
          {particle} 연결되었습니다
        </h1>
        <p className="mx-auto mt-6 max-w-[300px] whitespace-pre-line text-[15px] font-light leading-[1.85] text-[#b8ae9e]">
          {`이제,\n언제든 다시 이어질 수 있어요`}
        </p>
      </header>

      {/* — 이어보기 (핵심) — */}
      <section className="mx-auto max-w-[340px] px-1">
        <div className="rounded-3xl border border-[#d4af37]/16 bg-gradient-to-b from-[#16130f]/95 to-[#0a0908]/98 px-6 py-9 text-center shadow-[0_0_40px_rgba(212,175,55,0.05)]">
          <p className="whitespace-pre-line text-[16px] font-light leading-[1.75] tracking-[-0.01em] text-[#ebe4d8]">
            {`이 연결은,\n여기서 끝나지 않습니다`}
          </p>
          <p className="mx-auto mt-5 max-w-[280px] text-[12px] leading-relaxed text-[#7a7268]">
            아이와의 이야기를 계속 이어갈 수 있어요
          </p>
          <div className="mt-10 flex justify-center">
            <a
              href={continueHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[#d4af37]/45 bg-[#d4af37]/[0.08] px-8 text-[14px] font-medium tracking-tight text-[#f0e6c8] transition hover:border-[#d4af37]/65 hover:bg-[#d4af37]/15 hover:shadow-[0_0_24px_rgba(212,175,55,0.15)]"
            >
              이어보기
            </a>
          </div>
        </div>
      </section>

      {/* — 보조: 기록·알림 — */}
      <section className="mx-auto max-w-[420px] space-y-6 border-t border-white/[0.06] pt-10">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-[#5c574e]">
          이어진 흔적
        </p>

        <div className="rounded-2xl border border-white/[0.06] bg-[#0c0c0a]/60 px-4 py-5">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] ${
                notifyOnScan
                  ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-100/90"
                  : "border-white/8 bg-white/[0.03] text-[#8a8278]"
              }`}
            >
              <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
              {notifyOnScan ? "스캔 알림 · 켜짐" : "스캔 알림 · 꺼짐"}
            </div>
            <p className="text-center text-[11px] text-[#5c574e]">등록 화면에서 바꿀 수 있어요</p>
          </div>
        </div>

        <OwnerWebPushSubscribe tagId={tagId} ownerKey={ownerKey} vapidPublicKey={webPushPublicKey} />

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <StatBubble label="메시지" value={summary.messageCount} hint="남겨진 말" />
          <StatBubble label="위치" value={summary.locationCount} hint="보내진 곳" />
          <StatBubble label="사진" value={summary.photoCount} hint="함께 온 순간" />
        </div>

        {heartTotal > 0 ? (
          <p className="text-center text-[12px] leading-relaxed text-[#6e685e]">
            누군가가 <span className="text-[#a89872]">{displayName}</span>
            {eulReul(displayName)} 생각하며 남긴 자국이에요
          </p>
        ) : (
          <p className="text-center text-[12px] leading-relaxed text-[#5c574e]">
            아직 도착한 인사는 없어요. 괜찮아요, 조용한 날도 소중해요
          </p>
        )}

        <div className="rounded-2xl border border-[#d4af37]/10 bg-[#0a0a09]/70 px-4 py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#5c574e]">태그가 열린 횟수</p>
          <p className="mt-1 text-[32px] font-extralight tabular-nums text-[#9a8a6e]">{summary.scanCount}</p>
        </div>
      </section>

      {/* — 하단 동선 — */}
      <footer className="mx-auto max-w-[400px] space-y-5 px-1">
        <p className="text-center text-[11px] leading-relaxed text-[#5c574e]">
          발견자 화면은{" "}
          <Link
            href={`/tag/${encTag}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#a89872] underline decoration-[#d4af37]/30 underline-offset-3 hover:text-[#d4c4a4]"
          >
            새 탭에서 미리보기
          </Link>
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Link
            href={regHref}
            className="flex min-h-[46px] items-center justify-center rounded-2xl border border-[#d4af37]/22 bg-transparent px-5 text-[13px] text-[#d8d0c4] transition hover:border-[#d4af37]/40 hover:bg-[#d4af37]/[0.06]"
          >
            보호 정보·알림 다듬기
          </Link>
          <Link
            href="/"
            className="flex min-h-[46px] items-center justify-center rounded-2xl border border-white/10 px-5 text-[13px] text-[#8a8278] transition hover:bg-white/[0.04]"
          >
            처음 화면으로
          </Link>
        </div>
      </footer>
    </div>
  );
}
