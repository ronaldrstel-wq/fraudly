import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { localeFromPathname } from "@/lib/i18n/paths";
import { REQUEST_LOCALE_HEADER } from "@/lib/i18n/request-locale";

/** Forward pathname locale to Server Components via request headers. */
export function withRequestLocaleHeader(request: NextRequest, init?: ResponseInit): NextResponse {
  const locale = localeFromPathname(request.nextUrl.pathname);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_LOCALE_HEADER, locale);
  return NextResponse.next({ ...init, request: { headers: requestHeaders } });
}
