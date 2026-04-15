import { Suspense } from "react";

import DashboardWorkspace from "./DashboardWorkspace";

export default function DashboardPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Suspense
        fallback={
          <div className="min-h-[320px] flex-1 animate-pulse rounded-xl bg-[var(--linen-95)]" />
        }
      >
        <DashboardWorkspace />
      </Suspense>
    </div>
  );
}