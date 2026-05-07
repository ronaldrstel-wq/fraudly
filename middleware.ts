import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Clerk session for auth() / currentUser() in route handlers.
 * API auth is enforced in handlers (JSON 401), not via auth.protect() here,
 * because Clerk's protect() returns 404 for unauthenticated API requests.
 */
const authMiddleware = clerkMiddleware();

export default function middleware(...args: Parameters<typeof authMiddleware>) {
  const request = args[0] as NextRequest;
  const host = request.nextUrl.hostname.toLowerCase();

  // Keep one canonical host in production to avoid first-request redirect chains.
  if (host === "www.fraudly.app") {
    const target = new URL(request.url);
    target.hostname = "fraudly.app";
    target.protocol = "https:";
    return NextResponse.redirect(target, 308);
  }

  if (process.env.PERF_BYPASS_AUTH === "1") {
    return NextResponse.next();
  }
  return authMiddleware(...args);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
