import Link from "next/link";

/** 페이지 맨 하단 법적·사업자 고지 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.05] pt-8 pb-4 text-center text-[10px] leading-relaxed text-[#5c574e]">
      <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[#7a7268]">
        <Link href="/privacy" className="underline decoration-white/12 underline-offset-4 hover:text-[#b8ae9e]">
          개인정보처리방침
        </Link>
        <span aria-hidden className="text-white/10">
          ·
        </span>
        <span>클라우드 저장(Supabase·해외) 처리위탁</span>
      </nav>
      <p className="mt-4 text-[#6e685e]">
        서비스 이용·기기 권한(카메라·위치·알림) 사용 시{" "}
        <Link href="/privacy" className="underline decoration-white/10 underline-offset-2">
          개인정보처리방침
        </Link>
        에 동의한 것으로 간주됩니다.
      </p>
      <p className="mt-5 font-medium text-[#8a8278]">주식회사 토일렛 아카이브</p>
      <p className="mt-1">ETERNAL BEAM · tag.eternalbeam.com</p>
      <p className="mt-2 text-[#4a453d]">© 주식회사 토일렛 아카이브</p>
    </footer>
  );
}
