"use client";

import Link from "next/link";
import { useState } from "react";

export function HomeHero() {
  const [tagId, setTagId] = useState("demo");
  const safe = tagId.trim() || "demo";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1120] via-[#0f172a] to-[#020617]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_22%,rgba(100,130,220,0.18),transparent_58%)]" />
        <div className="stars-layer">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className="star" />
          ))}
        </div>
      </div>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-8">
        <div className="w-full max-w-[400px] rounded-2xl border border-white/20 bg-white/10 px-6 py-8 shadow-[0_0_40px_rgba(100,150,255,0.2)] backdrop-blur-xl sm:px-8 sm:py-10">
          <div className="text-center">
            <p className="animate-fade-in mb-3 text-[11px] font-medium uppercase tracking-[0.35em] text-[var(--accent-a)]">
              Eternal Beam
            </p>
            <h1 className="animate-fade-in text-[clamp(2rem,8vw,2.75rem)] font-extralight leading-[1.1] tracking-tight text-white [text-shadow:0_0_28px_rgba(180,200,255,0.25),0_0_60px_rgba(100,130,220,0.12)]">
              ETERNAL
              <br />
              <span className="bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text font-light text-transparent">
                BEAM
              </span>
            </h1>
            <p className="animate-fade-in-delay mt-4 text-base font-light text-white/70">
              Preserve Every Moment
            </p>
            <p className="animate-fade-in-delay-2 mx-auto mt-6 max-w-[340px] text-[15px] leading-relaxed text-white/70">
              QR을 스캔하면 반려견 정보를 확인할 수 있습니다
            </p>

            <div className="animate-fade-in-delay-2 mx-auto mt-10 w-full max-w-[320px] space-y-3">
              <label className="block text-left">
                <span className="mb-2 block text-xs font-medium text-white/70">태그 ID</span>
                <input
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="예: demo"
                  className="min-h-[52px] w-full rounded-xl border border-white/15 bg-white/5 px-4 text-[15px] text-white outline-none backdrop-blur-sm transition focus:border-white/25 focus:shadow-[0_0_0_3px_rgba(124,140,255,0.15)]"
                />
              </label>

              <Link
                href={`/tag/${encodeURIComponent(safe)}/register`}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-purple-400 to-blue-400 py-3 text-[15px] font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-[0_8px_32px_rgba(147,112,255,0.35)] active:scale-[0.99]"
              >
                내 태그 등록하기
              </Link>
              <Link
                href={`/tag/${encodeURIComponent(safe)}`}
                className="flex min-h-[52px] w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 py-3 text-[15px] font-medium text-white/90 transition hover:border-white/20 hover:bg-white/10"
              >
                정보 조회하기
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
