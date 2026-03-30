import InventoryTable from "@/components/InventoryTable/InventoryTable";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 h-full min-h-0">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Inventory
        </h1>
        <p className="mt-2 text-[var(--text-secondary)] leading-relaxed text-sm">
          Stock by variant — search filters the list; fewer rows per page, load more via pagination.
        </p>
      </div>
      <div className="flex-1 min-h-0 ">
        <InventoryTable />
      </div>
    </div>
  );
}
