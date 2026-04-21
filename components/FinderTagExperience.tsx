"use client";

import { EternalBeamMark } from "@/components/EternalBeamMark";
import { FinderLocationShare } from "@/components/FinderLocationShare";

type Props = {
  tagId: string;
  petName: string;
  ownerPhone: string;
  petImage: string | null;
};

/**
 * 발견자: 등록 데이터(petName, petImage, ownerPhone)와 연결된 감정형 UI
 */
export function FinderTagExperience({ tagId, petName, ownerPhone, petImage }: Props) {
  const tel = ownerPhone.replace(/\s/g, "");
  const smsHref = `sms:${tel}`;

  return (
    <div className="min-h-[50vh] space-y-9 pb-16 pt-4">
      <EternalBeamMark />

      <div className="flex flex-col items-center">
        <div
          className="relative mx-auto size-[min(72vw,240px)] shrink-0 sm:size-[220px]"
          style={{
            filter: "drop-shadow(0 0 28px rgba(212, 175, 55, 0.22)) drop-shadow(0 0 48px rgba(212, 175, 55, 0.08))",
          }}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d4af37]/25 via-transparent to-[#8a7020]/15 p-[2px]">
            <div className="size-full overflow-hidden rounded-full bg-[#0b0b0b] p-[3px]">
              {petImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={petImage}
                  alt={`${petName}의 얼굴`}
                  className="size-full rounded-full object-cover object-center"
                />
              ) : (
                <div className="flex size-full items-center justify-center rounded-full bg-[#141210] text-sm text-[#5c574e]">
                  사진
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[340px] space-y-6 text-center">
          <p className="text-[17px] font-light leading-[1.65] tracking-[-0.02em] text-[#f5ede0]">
            안녕하세요, 저는 <span className="font-medium text-[#e8d5a3]">{petName}</span>이에요
          </p>

          <p className="text-[15px] leading-[1.8] text-[#b8ae9e]">
            혹시 저를 발견하셨다면,
            <br />
            저의 가족에게 연락해주실 수 있을까요?
          </p>

          <p className="text-[12px] leading-relaxed text-[#7a7268]">저는 낯선 곳이 조금 무서워요</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[420px] px-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2">
          <a
            href={`tel:${tel}`}
            className="eb-finder-tel flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-center text-[14px] font-semibold text-[#1c1810] motion-safe:transition-all"
          >
            <span className="text-[15px]">📞</span>
            <span className="mt-0.5 leading-tight">보호자에게 전화하기</span>
          </a>
          <a
            href={smsHref}
            className="eb-finder-sms flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl px-2 py-2.5 text-center text-[14px] font-medium text-[#ebe4d8] motion-safe:transition-all"
          >
            <span className="text-[15px]">💬</span>
            <span className="mt-0.5 leading-tight">문자 보내기</span>
          </a>
          <div className="flex-1 sm:min-w-0">
            <FinderLocationShare tagId={tagId} ownerPhoneDigits={tel} />
          </div>
        </div>
      </div>
    </div>
  );
}
