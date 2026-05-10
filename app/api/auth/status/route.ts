import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const noStoreJson = { headers: { "Cache-Control": "private, no-store, max-age=0" } };

/** Lightweight session flag for client UI (no Clerk browser bundle). */
export async function GET() {
  try {
    const { userId } = await auth();
    return NextResponse.json({ signedIn: Boolean(userId) }, noStoreJson);
  } catch {
    return NextResponse.json({ signedIn: false }, noStoreJson);
  }
}
