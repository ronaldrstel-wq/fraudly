import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const { sessionId } = await auth();

  if (sessionId) {
    try {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[api/auth/sign-out] revokeSession failed", e);
      }
    }
  }

  return NextResponse.redirect(new URL("/", origin), { status: 303 });
}
