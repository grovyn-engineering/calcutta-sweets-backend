const AUTH_KEY = "calcutta_auth";

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

export function getEffectiveShopCodeForHeader(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(EFFECTIVE_SHOP_STORAGE_KEY);
  } catch {
    return null;
  }
}

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

export function getApiBaseUrlLongRunning(): string {
  if (typeof window === "undefined") {
    return getApiBaseUrl();
  }
  const raw = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    const base = raw.replace(/\/+$/, "");
    return base.endsWith("/api") ? base : `${base}/api`;
  }
  return getApiBaseUrl();
}

export async function apiFetchLong(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrlLongRunning();
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const method = (init.method || "GET").toUpperCase();
  const fullUrl = `${base}${pathPart}`;

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

  return fetch(fullUrl, { ...init, headers });
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
  const method = (init.method || "GET").toUpperCase();
  const fullUrl = `${base}${pathPart}`;

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

  if (method === "GET") {
    const shop = headers.get("X-Shop") || "default";
    const dedupeKey = `${method}:${fullUrl}:${shop}`;
    
    const sharedPromise = dedupeInFlight(dedupeKey, () => 
      fetch(fullUrl, { ...init, headers })
    );

    const response = await sharedPromise;
    return response.clone();
  }

  return fetch(fullUrl, { ...init, headers });
}

const inFlightByKey = new Map<string, Promise<unknown>>();

export function dedupeInFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const hit = inFlightByKey.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const p = run().finally(() => {
    inFlightByKey.delete(key);
  });
  inFlightByKey.set(key, p);
  return p;
}
