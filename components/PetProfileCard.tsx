import type { PetRow } from "@/lib/pet";
import { getPetDisplayImageUrl } from "@/lib/pet-helpers";
import { Card } from "@/components/ui/Card";

type Props = {
  pet: PetRow;
};

export function PetProfileCard({ pet }: Props) {
  const img = getPetDisplayImageUrl(pet);
  const tel = pet.phone.replace(/\s/g, "");

  return (
    <Card className="animate-fade-in-delay space-y-6 overflow-hidden">
      {img ? (
        <div className="-mx-5 -mt-5 overflow-hidden rounded-t-[19px] sm:-mx-6 sm:-mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt={pet.name}
            className="max-h-[min(420px,62vh)] w-full object-cover object-center"
          />
        </div>
      ) : null}

      <div className="space-y-1 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">이름</p>
        <p className="text-3xl font-extralight tracking-tight text-white">{pet.name}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">전화번호</p>
        <p className="mt-2 text-lg tabular-nums tracking-tight text-white">{pet.phone}</p>
      </div>

      <a
        href={`tel:${tel}`}
        className="btn-gradient flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl text-[16px] font-medium text-white"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="opacity-95" aria-hidden>
          <path
            d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.2 1.1.4 2.3.6 3.6.6.6 0 1.1.5 1.1 1.1V20c0 .6-.5 1.1-1.1 1.1C9.4 21.1 2.9 14.6 2.9 6.6 2.9 6 3.4 5.5 4 5.5h2.2c.6 0 1.1.5 1.1 1.1 0 1.3.2 2.5.6 3.6.2.4.1.9-.2 1.2L6.6 10.8z"
            fill="currentColor"
          />
        </svg>
        전화하기
      </a>

      {pet.description ? (
        <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">메모</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">{pet.description}</p>
        </div>
      ) : null}
    </Card>
  );
}
