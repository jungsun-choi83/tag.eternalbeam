import { HomeHero } from "@/components/HomeHero";

type Props = {
  searchParams: Promise<{ tag?: string | string[] }>;
};

function firstTag(v: string | string[] | undefined): string | undefined {
  if (v == null) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const t = s?.trim();
  return t ? t : undefined;
}

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const initialTagId = firstTag(sp.tag);
  return <HomeHero initialTagId={initialTagId} />;
}
