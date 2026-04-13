"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(isAuthenticated ? "/dashboard" : "/login");
  }, [isAuthenticated, isLoading, router]);

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
