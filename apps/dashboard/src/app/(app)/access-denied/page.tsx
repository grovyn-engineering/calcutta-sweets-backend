import { Suspense } from "react";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { AccessDeniedContent } from "./AccessDeniedContent";

export default function AccessDeniedPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <ContentSkeleton variant="rows" rowCount={4} className="max-w-md w-full" />
        </div>
      }
    >
      <AccessDeniedContent />
    </Suspense>
  );
}
