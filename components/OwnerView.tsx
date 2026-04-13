import Link from "next/link";
import { OwnerNotifyToggle } from "@/components/OwnerNotifyToggle";
import { Card } from "@/components/ui/Card";
import { getPetDisplayImageUrl } from "@/lib/pet-helpers";
import type { PetRow } from "@/lib/pet";

type Props = {
  pet: PetRow;
  tagId: string;
  ownerKey: string;
};

export function OwnerView({ pet, tagId, ownerKey }: Props) {
  const img = getPetDisplayImageUrl(pet);
  const ownerQs = `?owner=${encodeURIComponent(ownerKey)}`;

  return (
    <div className="space-y-6">
      <header className="text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[var(--accent-a)]">
          Eternal Beam
        </p>
        <h1 className="mt-2 text-xl font-light text-white">견주 관리</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">태그 · {tagId}</p>
      </header>

      <Card className="animate-fade-in-delay flex flex-col gap-5 overflow-hidden sm:flex-row sm:items-center">
        {img ? (
          <div className="mx-auto shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={pet.name} className="size-28 object-cover sm:size-32" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">이름</p>
          <p className="text-2xl font-extralight tracking-tight text-white">{pet.name}</p>
          <p className="pt-1 text-sm tabular-nums text-white/80">{pet.phone}</p>
        </div>
      </Card>

      <div className="space-y-3">
        <Link
          href={`/tag/${encodeURIComponent(tagId)}/register${ownerQs}`}
          className="btn-gradient flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-medium text-white"
        >
          보호 정보 수정
        </Link>

        <OwnerNotifyToggle
          tagId={tagId}
          ownerKey={ownerKey}
          initialNotifyOnScan={Boolean(pet.notify_on_scan)}
        />

        <Link
          href={`/tag/${encodeURIComponent(tagId)}/card${ownerQs}`}
          className="btn-gradient flex min-h-[52px] w-full items-center justify-center rounded-2xl text-[15px] font-medium text-white"
        >
          사진 꾸미기
        </Link>

        <p className="text-center text-xs leading-relaxed text-[var(--muted)]">
          아크릴 카드 결제·제작은 사진 꾸미기 화면에서 이어집니다.
        </p>
      </div>
    </div>
  );
}
