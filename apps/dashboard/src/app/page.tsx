"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useShop } from "@/contexts/ShopContext";
import {
  getFirstAllowedNavHref,
  isDashboardNavAllowed,
} from "@/lib/appNavAccess";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, permissions } = useAuth();
  const { effectiveShopCode, shops } = useShop();

  const isFactory = useMemo(() => {
    const s = shops.find((x) => x.shopCode === effectiveShopCode);
    return !!s?.isFactory;
  }, [shops, effectiveShopCode]);

  const navCtx = useMemo(
    () => ({ user, permissions, isFactory }),
    [user, permissions, isFactory],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!user || !permissions) {
      router.replace("/dashboard");
      return;
    }
    if (isDashboardNavAllowed(navCtx)) {
      router.replace("/dashboard");
      return;
    }
    const next = getFirstAllowedNavHref(navCtx);
    router.replace(next ?? "/access-denied?reason=no-access");
  }, [isAuthenticated, isLoading, user, permissions, navCtx, router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        boxSizing: "border-box",
        padding: 24,
        background: "var(--linen-100)",
      }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <ContentSkeleton variant="table" rowCount={8} />
    </div>
  );
}
