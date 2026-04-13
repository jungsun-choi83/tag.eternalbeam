import { Suspense } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { RegisterOwnerRequired } from "@/components/RegisterOwnerRequired";
import { isPetRegistered } from "@/lib/pet-helpers";
import { getPet } from "@/lib/pet";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{ tagId: string }>;
  searchParams: Promise<{ owner?: string | string[] }>;
};

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export default async function RegisterPage({ params, searchParams }: Props) {
  const { tagId } = await params;
  const ownerParam = firstParam((await searchParams).owner);

  let ownerKeyForEdit: string | undefined;
  if (isSupabaseConfigured()) {
    const pet = await getPet(tagId);
    if (isPetRegistered(pet)) {
      const key = pet.owner_key ?? null;
      if (key && ownerParam !== key) {
        return <RegisterOwnerRequired tagId={tagId} />;
      }
      if (key && ownerParam === key) {
        ownerKeyForEdit = key;
      }
    }
  }

  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-10 text-[var(--muted)]">불러오는 중…</main>
      }
    >
      <RegisterForm tagId={tagId} ownerKeyForEdit={ownerKeyForEdit} />
    </Suspense>
  );
}
