export function isAdminRecalcAuthorized(request: Request): boolean {
  const expected = process.env.ADMIN_RECALC_KEY?.trim();
  const provided =
    request.headers.get("x-admin-key")?.trim() ??
    request.headers.get("x-admin-recalc-key")?.trim() ??
    request.headers.get("authorization")?.trim().replace(/^Bearer\s+/i, "");
  return Boolean(expected && provided && provided === expected);
}
