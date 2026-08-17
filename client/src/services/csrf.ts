/**
 * CSRF double-submit token handling.
 *
 * In production the API enables `JWT_COOKIE_CSRF_PROTECT`, which requires
 * mutating requests to echo a token in a header. The auth cookies themselves are
 * `httpOnly` and unreadable, but the server also sets companion
 * `csrf_access_token` / `csrf_refresh_token` cookies that are deliberately
 * readable so the client can copy them into the header.
 *
 * The point of the pattern: an attacker on another origin can cause the browser
 * to *send* cookies, but cannot *read* them, so cannot populate the header.
 */

/** Header the API expects. Matches JWT_ACCESS_CSRF_HEADER_NAME. */
export const CSRF_HEADER = 'X-CSRF-TOKEN';

/** Methods the API applies CSRF protection to. Matches JWT_CSRF_METHODS. */
const PROTECTED_METHODS = new Set(['post', 'put', 'patch', 'delete']);

/** Read a cookie by name, or undefined when absent. */
const readCookie = (name: string): string | undefined => {
  // Cookie values are URL-encoded on the wire.
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

export const getAccessCsrfToken = (): string | undefined => readCookie('csrf_access_token');

/**
 * The refresh endpoint verifies the refresh token, so it needs that token's
 * companion rather than the access one.
 */
export const getRefreshCsrfToken = (): string | undefined => readCookie('csrf_refresh_token');

export const requiresCsrfToken = (method: string | undefined): boolean =>
  PROTECTED_METHODS.has((method ?? 'get').toLowerCase());

/**
 * Build the CSRF header for a request, or an empty object when none applies.
 *
 * Absent in development, where the API leaves CSRF protection off; the header is
 * simply omitted rather than sent empty.
 */
export const csrfHeaders = (
  method: string | undefined,
  url: string | undefined
): Record<string, string> => {
  if (!requiresCsrfToken(method)) return {};

  const isRefresh = Boolean(url?.includes('/auth/refresh'));
  const token = isRefresh ? getRefreshCsrfToken() : getAccessCsrfToken();

  return token ? { [CSRF_HEADER]: token } : {};
};
