import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] pt-8 pb-2 text-center text-[11px] leading-relaxed text-[#6e685e]">
      <p className="font-medium text-[#9a9288]">주식회사 토일렛 아카이브</p>
      <p className="mt-2">서비스명 ETERNAL BEAM · tag.eternalbeam.com</p>
      <nav className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[#8a8278]">
        <Link href="/privacy" className="underline decoration-white/15 underline-offset-4 hover:text-[#d4c4a4]">
          개인정보처리방침
        </Link>
        <span aria-hidden className="text-white/10">
          |
        </span>
        <span>클라우드 저장: Supabase (해외)</span>
      </nav>
      <p className="mt-3 text-[10px] text-[#5c574e]">© 주식회사 토일렛 아카이브. All rights reserved.</p>
    </footer>
  );
}
