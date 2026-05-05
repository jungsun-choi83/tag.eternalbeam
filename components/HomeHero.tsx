"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EternalBeamMark } from "@/components/EternalBeamMark";

type Props = {
  initialTagId?: string;
};

type Particle = {
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  dx: string;
  dy: string;
};

type HomeSparkle = {
  left: string;
  delay: string;
  duration: string;
  rise: string;
};

export function HomeHero({ initialTagId }: Props) {
  const [slug, setSlug] = useState(initialTagId ?? "");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (initialTagId) setSlug(initialTagId);
  }, [initialTagId]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ms = reduce ? 80 : 1180;
    const t = window.setTimeout(() => setLoaded(true), ms);
    return () => window.clearTimeout(t);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 34 }, (_, i) => ({
      left: `${((i * 17) % 100) + (i % 3) * 0.4}%`,
      top: `${((i * 23) % 100) + ((i * 5) % 4) * 0.3}%`,
      size: 1.5 + (i % 4) * 0.85,
      duration: 22 + (i % 12) * 2.2,
      delay: (i * 0.41) % 10,
      dx: `${-15 + (i * 11) % 38}px`,
      dy: `${-25 - (i * 9) % 55}px`,
    }));
  }, []);

  /** 메인 하단: 오로라 위로 올라오는 스파클 */
  const homeSparkles = useMemo<HomeSparkle[]>(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      left: `${2 + ((i * 37) % 96)}%`,
      delay: `${((i * 0.21) % 5.8).toFixed(2)}s`,
      duration: `${9.5 + (i % 11) * 1.35}s`,
      rise: `${120 + (i * 17) % 140}px`,
    }));
  }, []);

  const trimmed = slug.trim();
  const canNavigate = trimmed.length > 0;
  const enc = canNavigate ? encodeURIComponent(trimmed) : "";

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0 bg-[#0B0B0B]" aria-hidden>
        <div className="eb-aurora" />
        <div className="eb-mist" />
        <div className="eb-particle-layer">
          {particles.map((p, i) => (
            <span
              key={i}
              className="eb-particle"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                ["--dx" as string]: p.dx,
                ["--dy" as string]: p.dy,
              }}
            />
          ))}
        </div>
        <div className="eb-home-bottom-rise">
          <div className="eb-home-bottom-aurora" />
          <div className="eb-home-sparkle-field">
            {homeSparkles.map((s, i) => (
              <span
                key={i}
                className="eb-home-sparkle"
                style={{
                  left: s.left,
                  animationDuration: s.duration,
                  animationDelay: s.delay,
                  ["--spark-rise" as string]: s.rise,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`eb-intro-screen fixed inset-0 z-[200] flex items-center justify-center transition-opacity duration-[650ms] ease-out ${
          loaded ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
        aria-hidden={loaded}
      >
        <div className="eb-intro-dot" />
      </div>

      <main
        className={`relative z-10 flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center py-10 transition-[opacity,transform] duration-[800ms] ease-out motion-reduce:transition-none ${
          loaded ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
        }`}
      >
        {loaded ? (
          <div className="mx-auto w-full max-w-[400px] px-1">
            <div className="eb-hero-line mb-6 w-full max-w-full" style={{ animationDelay: "0.02s" }}>
              <EternalBeamMark />
            </div>
            <p
              className="eb-hero-line text-center text-[12px] font-medium tracking-[0.18em] text-[#c4a85a]/95"
              style={{ animationDelay: "0.05s" }}
            >
              아이와 다시 연결되는 순간
            </p>

            <h1
              className="eb-hero-line mt-5 text-center text-[clamp(1.35rem,5.2vw,1.65rem)] font-light leading-[1.55] tracking-[-0.03em] text-[#faf6ef]"
              style={{ animationDelay: "0.65s" }}
            >
              그 아이의 기억이,
              <br />
              다시 당신에게 도착합니다
            </h1>

            <p
              className="eb-hero-line mx-auto mt-5 max-w-[340px] text-center text-[14px] leading-relaxed text-[var(--muted)]"
              style={{ animationDelay: "1.25s" }}
            >
              이 태그를 통해, 당신의 아이와 연결이 시작됩니다
            </p>

            <p
              className="eb-hero-line mx-auto mt-8 max-w-[320px] text-center text-[13px] leading-[1.75] text-[#8a8275]"
              style={{ animationDelay: "1.85s" }}
            >
              이 작은 태그는, 한 아이의 기억으로 이어집니다
            </p>

            <div
              className="eb-hero-line eb-home-card-wrap mx-auto mt-10"
              style={{ animationDelay: "2.35s" }}
            >
              <div className="eb-home-card px-6 py-8 sm:px-8 sm:py-9">
              <p className="text-center text-[13px] leading-relaxed text-[#b8ae9e]">
                휴대폰으로 태그의 QR을 찍으면
                <br />
                이곳으로 이어질 수 있어요
              </p>
              <p className="mt-3 text-center text-[12px] text-[#6e685e]">
                태그에 적힌 이름이 있으면, 그대로 적어 주세요.
              </p>

              {initialTagId ? (
                <p className="mt-4 rounded-xl border border-[#d4af37]/20 bg-[rgba(212,175,55,0.06)] px-3 py-2 text-center text-[12px] text-[#e8dcc4]">
                  연결 이름 · <span className="font-medium text-[#f5edd8]">{initialTagId}</span>
                </p>
              ) : null}

              <div className="mt-7">
                <label className="block">
                  <span className="mb-2 block text-center text-[11px] tracking-wide text-[#7a7268]">
                    필요할 때만
                  </span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="이 아이를 부르는 이름"
                    autoComplete="off"
                    className="min-h-[52px] w-full rounded-xl border border-[#d4af37]/18 bg-[#080807]/80 px-4 text-[15px] text-[#f5f0e8] outline-none transition placeholder:text-[#5c574e] focus:border-[#d4af37]/45 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.12)]"
                  />
                </label>
              </div>

              <div className="mt-8 space-y-3">
                <Link
                  href={canNavigate ? `/tag/${enc}/register` : "#"}
                  aria-disabled={!canNavigate}
                  onClick={(e) => {
                    if (!canNavigate) e.preventDefault();
                  }}
                  className={`eb-cta-primary flex min-h-[54px] w-full items-center justify-center rounded-2xl px-5 text-[15px] motion-safe:transition-transform ${
                    !canNavigate ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  이 아이와 연결하기
                </Link>

                <Link
                  href={canNavigate ? `/tag/${enc}` : "#"}
                  aria-disabled={!canNavigate}
                  onClick={(e) => {
                    if (!canNavigate) e.preventDefault();
                  }}
                  className={`eb-cta-secondary flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[14px] motion-safe:transition-transform ${
                    !canNavigate ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  이미 연결되어 있다면 → 기억 열기
                </Link>
              </div>

              {!canNavigate ? (
                <p className="mt-4 text-center text-[11px] leading-relaxed text-[#5c574e]">
                  위에 이름을 적으면 버튼이 비춥니다
                </p>
              ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}
