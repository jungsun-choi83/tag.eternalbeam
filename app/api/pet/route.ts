import { NextRequest, NextResponse } from "next/server";
import { toPublicPet } from "@/lib/pet-helpers";
import { getPet } from "@/lib/pet";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const tagId = req.nextUrl.searchParams.get("tagId");
  if (!tagId) {
    return NextResponse.json({ error: "tagId is required" }, { status: 400 });
  }
  const pet = await getPet(tagId);
  return NextResponse.json({ pet: toPublicPet(pet) });
}
