import OrdersTable from "@/components/OrdersTable/OrdersTable";

export default function OrdersPage() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Orders
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          Sales saved from Billing POS appear here with payment mode and totals.
          Stock is reduced when a bill is generated.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <OrdersTable />
      </div>
    </div>
  );
}
