"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
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
      <div className="flex min-h-screen w-full items-start justify-center bg-[var(--linen)] px-4 py-10">
        <div className="w-full max-w-lg" role="status" aria-live="polite" aria-label="Loading">
          <ContentSkeleton variant="table" rowCount={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-[var(--linen)]">
      <div className="w-full flex-1">{children}</div>
    </div>
  );
}
