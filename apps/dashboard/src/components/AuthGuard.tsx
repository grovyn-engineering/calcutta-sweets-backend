"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import {
  matchAppNavItem,
  isAppNavAllowed,
  getFirstAllowedNavHref,
  isDashboardNavAllowed,
} from "@/lib/appNavAccess";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";

import styles from "./AuthGuard.module.css";

const ACCESS_DENIED_PATH = "/access-denied";

const PROTECTED_PATHS = [
  "/dashboard",
  "/billing-pos",
  "/orders",
  "/products",
  "/inventory",
  "/categories",
  "/reports",
  "/users",
  "/settings",
  "/shops",
  "/logout",
  "/stock-transfers",
  ACCESS_DENIED_PATH,
];

function isProtectedPath(path: string) {
  if (path === "/") return true;
  return PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

function isDashboardEntryPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/**
 * Protects (app) routes. Wraps the full AppLayout so the session loader can cover
 * the entire viewport (sidebar + header + main), not only the content column.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, permissions } = useAuth();
  const { effectiveShopCode, shops } = useShop();
  const redirectingRef = useRef(false);

  const isFactory = useMemo(() => {
    const s = shops.find((x) => x.shopCode === effectiveShopCode);
    return !!s?.isFactory;
  }, [shops, effectiveShopCode]);

  const navCtx = useMemo(
    () => ({ user, permissions, isFactory }),
    [user, permissions, isFactory],
  );
  const loadingDebug = useMemo(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    return [
      `path=${pathname}`,
      `isLoading=${String(isLoading)}`,
      `isAuthenticated=${String(isAuthenticated)}`,
      `user=${user?.email ?? "none"}`,
      `permissions=${permissions ? "yes" : "no"}`,
      `shop=${effectiveShopCode || "none"}`,
      `ua=${ua}`,
    ].join(" | ");
  }, [pathname, isLoading, isAuthenticated, user?.email, permissions, effectiveShopCode]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && isProtectedPath(pathname)) {
      router.replace("/login");
    }
  }, [pathname, isAuthenticated, isLoading, router]);

  useEffect(() => {
    redirectingRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || !permissions) return;
    if (!isProtectedPath(pathname)) return;
    if (pathname === ACCESS_DENIED_PATH) return;

    const rule = matchAppNavItem(pathname);
    if (!rule) {
      return;
    }
    const allowed = isAppNavAllowed(rule, navCtx);
    if (allowed) {
      return;
    }

    if (redirectingRef.current) return;
    redirectingRef.current = true;

    if (isDashboardEntryPath(pathname)) {
      const next = getFirstAllowedNavHref(navCtx);
      if (next) {
        router.replace(next);
      } else {
        router.replace(`${ACCESS_DENIED_PATH}?reason=no-access`);
      }
      return;
    }

    router.replace(
      `${ACCESS_DENIED_PATH}?from=${encodeURIComponent(pathname)}`,
    );
  }, [
    pathname,
    isAuthenticated,
    isLoading,
    user,
    permissions,
    navCtx,
    isFactory,
    router,
  ]);

  if (isLoading) {
    return (
      <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Loading session">
        <ContentSkeleton variant="table" rowCount={10} />
        <pre style={{ marginTop: 12, padding: 8, background: "#fff8dc", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {loadingDebug}
        </pre>
      </div>
    );
  }

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return (
      <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Redirecting">
        <ContentSkeleton variant="table" rowCount={6} />
        <pre style={{ marginTop: 12, padding: 8, background: "#fff8dc", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {loadingDebug}
        </pre>
      </div>
    );
  }

  if (
    isAuthenticated &&
    user &&
    permissions &&
    isProtectedPath(pathname) &&
    pathname !== ACCESS_DENIED_PATH
  ) {
    const rule = matchAppNavItem(pathname);
    if (rule && !isAppNavAllowed(rule, navCtx)) {
      return (
        <div className={styles.bootstrapShell} role="status" aria-live="polite" aria-label="Redirecting">
          <ContentSkeleton variant="table" rowCount={6} />
          <pre style={{ marginTop: 12, padding: 8, background: "#fff8dc", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {loadingDebug}
          </pre>
        </div>
      );
    }
  }

  return <>{children}</>;
}
