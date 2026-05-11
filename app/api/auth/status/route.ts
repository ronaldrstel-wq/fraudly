import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isCurrentUserAdmin } from "@/lib/auth/isAdmin";

const noStoreJson = { headers: { "Cache-Control": "private, no-store, max-age=0" } };

/** Lightweight session flag for client UI (no Clerk browser bundle). */
export async function GET() {
  try {
    const { userId } = await auth();
    const signedIn = Boolean(userId);
    const isAdmin = signedIn ? await isCurrentUserAdmin() : false;
    return NextResponse.json({ signedIn, isAdmin }, noStoreJson);
  } catch {
    return NextResponse.json({ signedIn: false, isAdmin: false }, noStoreJson);
  }
}
