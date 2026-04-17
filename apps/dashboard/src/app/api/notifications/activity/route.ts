import { NextRequest, NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

function emptyPayload() {
  return NextResponse.json({ since: "", items: [] }, { status: 200 });
}

/**
 * Proxies shop activity to Nest without using next.config rewrites. When the API is
 * down or misconfigured, returns an empty payload instead of surfacing ECONNREFUSED
 * through the dev proxy (which spams the terminal on every poll).
 */
export async function GET(req: NextRequest) {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const url = `${base}/notifications/activity`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const shop = req.headers.get("x-shop");
  if (shop) headers.set("x-shop", shop);

  try {
    const res = await fetch(url, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    if (!res.ok) {
      return emptyPayload();
    }
    try {
      JSON.parse(text);
    } catch {
      return emptyPayload();
    }
    return new NextResponse(text, {
      status: 200,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  } catch {
    return emptyPayload();
  }
}
