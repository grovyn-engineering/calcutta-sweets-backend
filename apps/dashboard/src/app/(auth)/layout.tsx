"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { PageBootstrapLoader } from "@/components/PageBootstrapLoader/PageBootstrapLoader";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (
      isAuthenticated &&
      (pathname === "/login" || pathname === "/forgot-password")
    ) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return <PageBootstrapLoader label="Loading" />;
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-[var(--linen)]">
      <div className="w-full flex-1">{children}</div>
    </div>
  );
}
