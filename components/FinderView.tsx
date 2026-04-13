import { NotifyOwnerButton } from "@/components/NotifyOwnerButton";
import { Card } from "@/components/ui/Card";
import { getPetDisplayImageUrl } from "@/lib/pet-helpers";
import type { PetRow } from "@/lib/pet";

type Props = {
  pet: PetRow;
  tagId: string;
};

export function FinderView({ pet, tagId }: Props) {
  const img = getPetDisplayImageUrl(pet);
  const tel = pet.phone.replace(/\s/g, "");

  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--accent-a)]">
          Eternal Beam
        </p>
        <h1 className="mt-2 text-xl font-light text-white">연락처</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">태그 · {tagId}</p>
      </header>

      <Card className="animate-fade-in-delay space-y-6 overflow-hidden">
        {img ? (
          <div className="-mx-5 -mt-5 overflow-hidden rounded-t-[19px] sm:-mx-6 sm:-mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={pet.name}
              className="max-h-[min(480px,68vh)] w-full object-cover object-center"
            />
          </div>
        ) : null}

        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">이름</p>
          <p className="text-3xl font-extralight tracking-tight text-white">{pet.name}</p>
        </div>

        <a
          href={`tel:${tel}`}
          className="block rounded-2xl border border-white/10 bg-white/[0.04] py-3 text-center text-sm text-[var(--accent-a)] underline-offset-4 hover:border-[var(--accent-a)]/30"
        >
          {pet.phone}
        </a>

        {pet.description ? (
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">설명</p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">{pet.description}</p>
          </div>
        ) : null}
      </Card>

      <div className="space-y-3 pb-4">
        <a
          href={`tel:${tel}`}
          className="btn-gradient flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-medium text-white"
        >
          전화하기
        </a>
        <NotifyOwnerButton tagId={tagId} />
      </div>
    </div>
  );
}
