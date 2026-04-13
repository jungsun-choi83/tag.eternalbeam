import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CardWorkspace } from "@/components/CardWorkspace";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getPet } from "@/lib/pet";
import { isSupabaseConfigured } from "@/lib/supabase-admin";
import { Card } from "@/components/ui/Card";

type Props = {
  params: Promise<{ tagId: string }>;
  searchParams: Promise<{ owner?: string | string[] }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function CardPage({ params, searchParams }: Props) {
  const { tagId } = await params;
  const ownerParam = firstParam((await searchParams).owner);

  if (!isSupabaseConfigured()) {
    return (
      <main className="animate-fade-in space-y-5 py-6">
        <Card>
          <h1 className="text-lg font-medium text-white">Supabase 연결 정보가 없습니다</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">카드 제작을 위해 Supabase 설정이 필요합니다.</p>
        </Card>
        <Link href="/" className="block text-center text-sm text-[var(--accent-a)] underline">
          홈으로
        </Link>
      </main>
    );
  }

  const pet = await getPet(tagId);
  if (!isPetRegistered(pet)) {
    redirect(`/tag/${encodeURIComponent(tagId)}/register`);
  }

  const key = pet.owner_key ?? null;
  if (key && ownerParam !== key) {
    redirect(`/tag/${encodeURIComponent(tagId)}`);
  }

  const ownerKeyForClient = key;

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-10 text-[var(--muted)]">불러오는 중…</main>
      }
    >
      <CardWorkspace tagId={tagId} ownerKey={ownerKeyForClient} />
    </Suspense>
  );
}
