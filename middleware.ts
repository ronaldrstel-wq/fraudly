import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { withRequestLocaleHeader } from "@/lib/i18n/middleware-locale";
import {
  CANONICAL_PRODUCTION_HOST,
  isPrivateNoindexPath,
  isWwwFraudlyProductionHost,
  normalizedRequestHost,
  shouldSetPreviewNoindexHeader,
  shouldSetProductionAllHeader
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

function crawlerHostInput(request: NextRequest) {
  return {
    forwardedHost: request.headers.get("x-forwarded-host"),
    hostHeader: request.headers.get("host"),
    urlHostname: request.nextUrl.hostname
  };
}

/** HTTP crawler directives — separate from HTML `<meta name="robots">`. */
function applyCrawlerHeaders(response: Response, request: NextRequest): Response {
  const hostInput = crawlerHostInput(request);
  const pathname = request.nextUrl.pathname;

  if (isPrivateNoindexPath(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (shouldSetPreviewNoindexHeader(hostInput)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (shouldSetProductionAllHeader(hostInput)) {
    response.headers.set("X-Robots-Tag", "all");
  }

  return response;
}

type ClerkMwResult = ReturnType<typeof authMiddleware>;

function withCrawlerHeaders(result: ClerkMwResult, request: NextRequest): ClerkMwResult {
  if (result == null) {
    return applyCrawlerHeaders(withRequestLocaleHeader(request), request);
  }
  if (result instanceof Promise) {
    return result.then((res) =>
      res instanceof Response
        ? applyCrawlerHeaders(res, request)
        : applyCrawlerHeaders(withRequestLocaleHeader(request), request)
    );
  }
  if (result instanceof Response) {
    return applyCrawlerHeaders(result, request);
  }
  return applyCrawlerHeaders(withRequestLocaleHeader(request), request);
}

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.nextUrl.pathname === "/latest") {
    const redirect = NextResponse.redirect(new URL("/latest-checks", request.url), 308);
    return applyCrawlerHeaders(redirect, request);
  }

  const host = normalizedRequestHost(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    request.nextUrl.hostname
  );
  if (isWwwFraudlyProductionHost(host)) {
    const url = request.nextUrl.clone();
    url.hostname = CANONICAL_PRODUCTION_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (process.env.PERF_BYPASS_AUTH === "1") {
    return applyCrawlerHeaders(withRequestLocaleHeader(request), request);
  }
  return withCrawlerHeaders(authMiddleware(request, event), request);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
