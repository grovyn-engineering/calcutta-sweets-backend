"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--linen)]">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--linen)]">
      {children}
    </div>
  );
}
