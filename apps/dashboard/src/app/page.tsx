"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--linen)]">
      <LoadingDots />
    </div>
  );
}
