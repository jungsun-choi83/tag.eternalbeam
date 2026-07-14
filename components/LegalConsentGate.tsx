"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "eb-legal-consent-v1";

export function LegalConsentGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") return;
      setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center bg-black/72 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-consent-title"
    >
      <div className="max-h-[min(88dvh,640px)] w-full max-w-[400px] overflow-y-auto rounded-3xl border border-white/12 bg-[#12100e] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:px-6">
        <h2 id="legal-consent-title" className="text-lg font-medium text-[#f5f0e8]">
          서비스 이용 안내
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-[#b8ae9e]">
          ETERNAL BEAM(이하 &quot;서비스&quot;)을 이용하려면 아래 항목에 <strong className="text-[#e8dcc4]">필수 동의</strong>가
          필요합니다. 동의하지 않으면 일부 기능을 사용할 수 없습니다.
        </p>

        <ul className="mt-5 space-y-4 text-[13px] leading-relaxed text-[#a89f92]">
          <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="font-medium text-[#ebe4d8]">[필수] 서비스 접근·기능 이용</p>
            <p className="mt-1.5">
              태그 조회, 보호 정보 등록, QR 연결, 발견자 연락·위치·사진·메시지 전달, 스캔 알림(선택 시) 등 서비스
              제공을 위해 필요한 정보 처리에 동의합니다.
            </p>
          </li>
          <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="font-medium text-[#ebe4d8]">[필수] 기기 권한(카메라·앨범·위치·알림)</p>
            <p className="mt-1.5">
              사진 업로드 시 카메라·앨범, 위치 공유 시 위치 정보, 스캔 알림 시 브라우저 알림 권한이 요청될 수 있습니다.
              권한은 해당 기능 사용 시에만 활용됩니다.
            </p>
          </li>
          <li className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
            <p className="font-medium text-[#ebe4d8]">[필수] 클라우드 저장·처리위탁</p>
            <p className="mt-1.5">
              업로드 사진·보호 정보 등은 <strong className="text-[#e8dcc4]">Supabase 클라우드(해외)</strong>에 저장·처리됩니다.
              위탁 내용은{" "}
              <Link href="/privacy" className="text-[#c4a85a] underline underline-offset-2">
                개인정보처리방침
              </Link>
              에서 확인할 수 있습니다.
            </p>
          </li>
        </ul>

        <p className="mt-4 text-[11px] leading-relaxed text-[#6e685e]">
          운영: <span className="text-[#9a9288]">주식회사 토일렛 아카이브</span>
        </p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            className="eb-cta-primary min-h-[50px] w-full rounded-2xl text-[15px] font-medium"
            onClick={() => {
              try {
                localStorage.setItem(STORAGE_KEY, "1");
              } catch {
                /* ignore */
              }
              setOpen(false);
            }}
          >
            모두 동의하고 시작하기
          </button>
          <p className="text-center text-[10px] text-[#5c574e]">
            동의 시 위 항목에 모두 동의한 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
