import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { FinderView } from "@/components/FinderView";
import { OwnerView } from "@/components/OwnerView";
import { TagScanEffects } from "@/components/TagScanEffects";
import { Card } from "@/components/ui/Card";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getPet } from "@/lib/pet";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { PaymentReturnHandler } from "./payment-return";

type Props = {
  params: Promise<{ tagId: string }>;
  searchParams: Promise<{ owner?: string | string[] }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export async function TagPage({ params, searchParams }: Props) {
  const { tagId } = await params;
  const sp = await searchParams;
  const ownerParam = firstParam(sp.owner);

  if (!isSupabaseConfigured()) {
    return (
      <main className="animate-fade-in space-y-5 py-6">
        <Card>
          <h1 className="text-lg font-medium text-white">Supabase 연결 정보가 없습니다</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            프로젝트 루트에 <code className="text-[var(--accent-a)]">.env.local</code> 파일을 만들고
            아래 값을 넣은 뒤, 개발 서버를 한 번 재시작하세요.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-slate-200">
            {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}
          </pre>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Supabase 대시보드 → Project Settings → API 에서 확인할 수 있습니다.
          </p>
        </Card>
        <Link href="/" className="block text-center text-sm text-[var(--accent-a)] underline">
          홈으로
        </Link>
      </main>
    );
  }

  const data = await getPet(tagId);
  if (!isPetRegistered(data)) {
    redirect(`/tag/${encodeURIComponent(tagId)}/register`);
  }

  const ownerKey = data.owner_key ?? null;
  const isOwner = Boolean(ownerKey && ownerParam && ownerParam === ownerKey);
  const logView = !isOwner && Boolean(data.notify_on_scan);
  const paymentOwnerKey = isOwner && ownerKey ? ownerKey : undefined;

  return (
    <main className="animate-fade-in space-y-6 py-6">
      <TagScanEffects tagId={tagId} logView={logView} />

      <Suspense fallback={null}>
        <PaymentReturnHandler tagId={tagId} ownerKey={paymentOwnerKey} />
      </Suspense>

      {isOwner && ownerKey ? (
        <OwnerView pet={data} tagId={tagId} ownerKey={ownerKey} />
      ) : (
        <FinderView pet={data} tagId={tagId} />
      )}
    </main>
  );
}
