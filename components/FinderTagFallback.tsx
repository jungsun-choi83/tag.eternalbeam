import Link from "next/link";

type Props = { tagId: string };

/** 등록 데이터가 없을 때 — 정보조회 느낌 없이 초대만 */
export function FinderTagFallback({ tagId }: Props) {
  const enc = encodeURIComponent(tagId);
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
      <div className="max-w-[320px] rounded-3xl border border-[#d4af37]/18 bg-[#10100e]/85 px-8 py-10 shadow-[0_0_48px_rgba(212,175,55,0.06)]">
        <p className="text-[13px] font-light leading-relaxed text-[#c9bfb0]">
          아직 등록되지 않은 태그입니다
        </p>
        <p className="mt-5 text-[12px] leading-[1.75] text-[#7a7268]">
          이 태그로 아이와 연결하려면
          <br />
          가족이 먼저 이곳을 채워 주어야 해요
        </p>
        <Link
          href={`/tag/${enc}/register`}
          className="eb-cta-primary mt-8 flex min-h-[52px] w-full items-center justify-center rounded-2xl px-5 text-[15px] font-medium"
        >
          태그 등록하기
        </Link>
      </div>
    </div>
  );
}
