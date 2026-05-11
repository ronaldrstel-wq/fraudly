import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { isProductionPublicSiteHost } from "@/lib/seo-host";

/**
 * Clerk session for auth() / currentUser() in route handlers.
 * API auth is enforced in handlers (JSON 401), not via auth.protect() here,
 * because Clerk's protect() returns 404 for unauthenticated API requests.
 */
const authMiddleware = clerkMiddleware();

function applyPreviewNoindex(response: Response, request: NextRequest): Response {
  const forwarded = request.headers.get("x-forwarded-host");
  const host = (forwarded?.split(",")[0]?.trim() || request.nextUrl.hostname).split(":")[0]?.toLowerCase() ?? "";
  if (!isProductionPublicSiteHost(host)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

type ClerkMwResult = ReturnType<typeof authMiddleware>;

function withPreviewNoindex(result: ClerkMwResult, request: NextRequest): ClerkMwResult {
  if (result == null) {
    return applyPreviewNoindex(NextResponse.next(), request);
  }
  if (result instanceof Promise) {
    return result.then((res) => withPreviewNoindex(res, request));
  }
  return applyPreviewNoindex(result, request);
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (process.env.PERF_BYPASS_AUTH === "1") {
    return applyPreviewNoindex(NextResponse.next(), request);
  }
  return withPreviewNoindex(authMiddleware(request, event), request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
