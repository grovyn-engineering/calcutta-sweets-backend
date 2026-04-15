"use client";

import { Segmented } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";

import DashboardHome from "@/components/DashboardHome/DashboardHome";
import ReportsHome from "@/components/ReportsHome/ReportsHome";
import { useAuth } from "@/contexts/AuthContext";

type WorkspaceTab = "overview" | "analytics";

export default function DashboardWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { permissions } = useAuth();

  const canOverview = permissions?.canAccessDashboard ?? true;
  const canAnalytics = permissions?.canAccessReports ?? true;

  const tabFromUrl: WorkspaceTab = useMemo(() => {
    return searchParams.get("tab") === "analytics" ? "analytics" : "overview";
  }, [searchParams]);

  const activeView: WorkspaceTab = useMemo(() => {
    if (tabFromUrl === "analytics" && canAnalytics) return "analytics";
    if (tabFromUrl === "overview" && canOverview) return "overview";
    if (canAnalytics && !canOverview) return "analytics";
    return "overview";
  }, [tabFromUrl, canOverview, canAnalytics]);

  useEffect(() => {
    if (!permissions) return;
    if (tabFromUrl === "analytics" && !canAnalytics) {
      router.replace("/dashboard", { scroll: false });
    } else if (tabFromUrl === "overview" && !canOverview && canAnalytics) {
      router.replace("/dashboard?tab=analytics", { scroll: false });
    }
  }, [permissions, tabFromUrl, canAnalytics, canOverview, router]);

  const showSwitcher = canOverview && canAnalytics;

  const onTabChange = useCallback(
    (v: string | number) => {
      const next = v === "analytics" ? "analytics" : "overview";
      if (next === "analytics") {
        router.replace("/dashboard?tab=analytics", { scroll: false });
      } else {
        router.replace("/dashboard", { scroll: false });
      }
    },
    [router],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {showSwitcher ? (
        <div className="flex shrink-0 justify-center sm:justify-start">
          <Segmented
            size="large"
            value={activeView}
            onChange={onTabChange}
            options={[
              { label: "Overview", value: "overview" },
              { label: "Analytics & reports", value: "analytics" },
            ]}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {activeView === "overview" && canOverview ? (
          <DashboardHome />
        ) : null}
        {activeView === "analytics" && canAnalytics ? (
          <ReportsHome variant="embedded" />
        ) : null}
      </div>
    </div>
  );
}
