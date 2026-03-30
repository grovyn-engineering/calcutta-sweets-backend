const AUTH_KEY = "calcutta_auth";

/** Must match `ShopContext` persistence key for `X-Shop` on API calls. */
export const EFFECTIVE_SHOP_STORAGE_KEY = "calcutta_effective_shop";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const { token } = JSON.parse(raw) as { token?: string };
    return token ?? null;
  } catch {
    return null;
  }
}

/** Current shop scope for `X-Shop` (super admin switcher + persisted choice). */
export function getEffectiveShopCodeForHeader(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(EFFECTIVE_SHOP_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Headers for authenticated, shop-scoped API calls.
 * Sends `Authorization` when a token exists and `X-Shop` when a shop code is known.
 */
function nestOriginFromEnv(): string {
  const explicit =
    process.env.INTERNAL_API_URL?.trim() ??
    process.env.API_UPSTREAM_URL?.trim() ??
    "";
  if (explicit) {
    const o = explicit.replace(/\/+$/, "");
    return o;
  }
  const pub = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");
  const origin = pub.replace(/\/api$/i, "");
  if (origin.startsWith("http://") || origin.startsWith("https://")) {
    return origin;
  }
  return "http://127.0.0.1:3001";
}

/**
 * Resolves the API base path including `/api` (Nest global prefix).
 *
 * **Browser:** same-origin `/api` unless `NEXT_PUBLIC_API_SAME_ORIGIN_PROXY=0`, then
 * `NEXT_PUBLIC_API_URL` is used directly. Rewrites in `next.config.ts` forward `/api`
 * to your Nest host (`API_UPSTREAM_URL`, or the origin from `NEXT_PUBLIC_API_URL`, or 3001).
 *
 * **SSR:** `INTERNAL_API_URL` / `API_UPSTREAM_URL`, else origin parsed from `NEXT_PUBLIC_API_URL`, else 3001.
 */
export function getApiBaseUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  const directApi =
    process.env.NEXT_PUBLIC_API_SAME_ORIGIN_PROXY === "0" && raw.length > 0;

  if (typeof window !== "undefined") {
    if (directApi) {
      const base = raw.replace(/\/+$/, "");
      return base.endsWith("/api") ? base : `${base}/api`;
    }
    return "/api";
  }

  const internal = nestOriginFromEnv().replace(/\/+$/, "");
  return internal.endsWith("/api") ? internal : `${internal}/api`;
}

export function getAuthHeaders(): Record<string, string> {
  const h: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    h.Authorization = `Bearer ${token}`;
  }
  const shop =
    getEffectiveShopCodeForHeader() ||
    process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ||
    "";
  if (shop) {
    h["X-Shop"] = shop;
  }
  return h;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl();
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers);
  const authHeaders = getAuthHeaders();
  for (const [key, value] of Object.entries(authHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(`${base}${pathPart}`, { ...init, headers });
}

const inFlightByKey = new Map<string, Promise<unknown>>();

/**
 * Reuse one in-flight promise per key so overlapping callers share a single request.
 * Helps when React 18 Strict Mode runs effects twice in development (and harmless in prod).
 */
export function dedupeInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const hit = inFlightByKey.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const p = run().finally(() => {
    inFlightByKey.delete(key);
  });
  inFlightByKey.set(key, p);
  return p;
}
