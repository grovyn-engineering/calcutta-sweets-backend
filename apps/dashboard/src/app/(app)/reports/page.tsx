import { redirect } from "next/navigation";

/** Reports merged into Dashboard → Analytics tab; keep URL for bookmarks. */
export default function ReportsPage() {
  redirect("/dashboard?tab=analytics");
}
