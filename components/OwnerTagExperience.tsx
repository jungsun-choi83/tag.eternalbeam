"use client";

import Link from "next/link";
import type { OwnerTagSummary } from "@/lib/tag-activity";

type Props = {
  tagId: string;
  ownerKey: string;
  petName: string;
  notifyOnScan: boolean;
  summary: OwnerTagSummary;
};

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
    <div className="flex min-h-[120px] flex-1 flex-col justify-between rounded-2xl border border-[#d4af37]/18 bg-gradient-to-b from-[#1a1510]/90 to-[#0e0d0b]/95 px-4 py-4 text-center shadow-[inset_0_1px_0_rgba(255,250,235,0.04)]">
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#9a9082]">{label}</p>
      <p className="my-2 text-[34px] font-extralight tabular-nums leading-none text-[#e8d5a3]">{value}</p>
      <p className="text-[11px] leading-snug text-[#6e685e]">{hint}</p>
    </div>
  );
}

/**
 * 견주 전용: 연결 확인·상태·기록 감각 (Owner 전용 UI — Finder와 완전 분리)
 */
export function OwnerTagExperience({ tagId, ownerKey, petName, notifyOnScan, summary }: Props) {
  const encTag = encodeURIComponent(tagId);
  const encOwner = encodeURIComponent(ownerKey);
  const regHref = `/tag/${encTag}/register?owner=${encOwner}`;

  const heartTotal = summary.messageCount + summary.photoCount;

  return (
    <div className="space-y-10 pb-16 pt-2">
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-[#7a7268]">보호자</p>
        <h1 className="mt-4 text-[clamp(1.6rem,6vw,2rem)] font-extralight tracking-[-0.03em] text-[#faf6ef]">
          연결되었습니다
        </h1>
        <p className="mx-auto mt-4 max-w-[300px] text-[14px] leading-relaxed text-[#a39888]">
          <span className="text-[#e8d5a3]">{petName}</span>의 태그가 당신과
          <br />
          조용히 이어져 있어요
        </p>
      </div>

      <div className="rounded-3xl border border-[#d4af37]/20 bg-[#0f0e0c]/80 px-5 py-6 shadow-[0_0_48px_rgba(212,175,55,0.06)]">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.2em] text-[#9a9082]">상태</p>
        <div className="mt-5 flex flex-col items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] ${
              notifyOnScan
                ? "border-emerald-500/35 bg-emerald-950/25 text-emerald-100/95"
                : "border-white/10 bg-white/[0.04] text-[#a39888]"
            }`}
          >
            <span className="size-2 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
            {notifyOnScan ? "스캔 알림 · 켜져 있어요" : "스캔 알림 · 꺼져 있어요"}
          </div>
          <p className="max-w-[280px] text-center text-[12px] leading-relaxed text-[#6e685e]">
            알림은 등록 화면에서 언제든 바꿀 수 있어요
          </p>
        </div>
      </div>

      <div>
        <p className="mb-4 text-center text-[12px] font-medium uppercase tracking-[0.2em] text-[#9a9082]">
          이어진 마음
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <StatBubble label="메시지" value={summary.messageCount} hint="남겨진 말" />
          <StatBubble label="위치" value={summary.locationCount} hint="보내진 곳" />
          <StatBubble label="사진" value={summary.photoCount} hint="함께 온 순간" />
        </div>
        {heartTotal > 0 ? (
          <p className="mt-5 text-center text-[13px] leading-relaxed text-[#a89e90]">
            누군가가 <span className="text-[#d4af37]/95">{petName}</span>을 생각하며 남긴 흔적이에요
          </p>
        ) : (
          <p className="mt-5 text-center text-[13px] leading-relaxed text-[#6e685e]">
            아직 도착한 인사는 없어요. 괜찮아요, 조용한 날도 소중해요
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-white/[0.08] bg-[#10100e]/90 px-5 py-6">
        <p className="text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[#7a7268]">기록</p>
        <p className="mt-3 text-center text-[42px] font-extralight tabular-nums text-[#c4a85a]">{summary.scanCount}</p>
        <p className="mt-1 text-center text-[12px] text-[#6e685e]">태그가 열린 획수</p>
      </div>

      <div className="space-y-3">
        <Link
          href={regHref}
          className="eb-cta-primary flex min-h-[54px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-medium"
        >
          보호 정보·알림 다듬기
        </Link>
        <Link
          href="/"
          className="eb-cta-secondary flex min-h-[48px] w-full items-center justify-center rounded-2xl px-5 text-[14px]"
        >
          처음 화면으로
        </Link>
      </div>
    </div>
  );
}
