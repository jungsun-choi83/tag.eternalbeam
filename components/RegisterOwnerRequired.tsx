import Link from "next/link";
import { Card } from "@/components/ui/Card";

/** 이미 등록된 태그인데 견주 키(?owner=) 없이 /register 로 온 경우 */
export function RegisterOwnerRequired({ tagId }: { tagId: string }) {
  const enc = encodeURIComponent(tagId);
  return (
    <main className="animate-fade-in mx-auto max-w-lg space-y-6 px-4 py-10">
      <header className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--accent-a)]">Eternal Beam</p>
        <h1 className="mt-2 text-2xl font-light tracking-tight text-white">이 태그는 이미 등록되어 있어요</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          처음 등록할 때 받은 <strong className="text-white/90">견주 관리 주소</strong>
          <span className="whitespace-nowrap text-[var(--accent-a)]"> (?owner=…)</span>로만 정보를 수정할 수
          있습니다. 그 주소를 잃었다면 같은 내용으로 다시 등록할 수는 없고, 발견자용 조회만 가능합니다.
        </p>
      </header>

      <Card className="space-y-4 border-white/10 px-5 py-5 text-sm leading-relaxed text-white/85">
        <p className="text-[var(--muted)]">태그 ID</p>
        <p className="font-mono text-lg text-white">{tagId}</p>
        <p className="pt-2 text-xs text-[var(--muted)]">
          새 태그 ID로 처음 등록하려면 홈에서 태그 ID를 바꾼 뒤「태그 처음 등록」으로 들어가 주세요.
        </p>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/tag/${enc}`}
          className="btn-gradient flex min-h-[48px] items-center justify-center rounded-2xl px-6 text-[15px] font-medium text-white"
        >
          발견자용 조회 (연락처)
        </Link>
        <Link
          href="/"
          className="flex min-h-[48px] items-center justify-center rounded-2xl border border-white/15 px-6 text-[15px] font-medium text-white/90 transition hover:border-white/25 hover:bg-white/5"
        >
          홈으로
        </Link>
      </div>
    </main>
  );
}
