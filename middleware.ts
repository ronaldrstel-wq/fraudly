import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  CANONICAL_PRODUCTION_HOST,
  isProductionPublicSiteHost,
  isWwwFraudlyProductionHost,
  normalizedRequestHost
} from "@/lib/seo-host";

const isRecentSearchesRoute = createRouteMatcher(["/recent-searches(.*)"]);

/**
 * Clerk session for auth() / currentUser() in route handlers.
 * API auth is enforced in handlers (JSON 401), not via auth.protect() here,
 * because Clerk's protect() returns 404 for unauthenticated API requests.
 *
 * Page routes that must never render a signed-out HTML shell (SEO + privacy) use `auth.protect()` here.
 */
const authMiddleware = clerkMiddleware(async (auth, req) => {
  if (isRecentSearchesRoute(req)) {
    await auth.protect();
  }
});

function applyPreviewNoindex(response: Response, request: NextRequest): Response {
  const host = normalizedRequestHost(request.headers.get("x-forwarded-host"), request.nextUrl.hostname);
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
  const host = normalizedRequestHost(request.headers.get("x-forwarded-host"), request.nextUrl.hostname);
  if (isWwwFraudlyProductionHost(host)) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_PRODUCTION_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

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
