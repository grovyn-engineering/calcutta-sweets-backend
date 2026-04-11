"use client";

import {
  Card,
  Empty,
  Flex,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  IndianRupee,
  Package,
  Receipt,
  ShoppingBag,
} from "lucide-react";

import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import { chartDayLabel, formatInrFull } from "@/lib/chartFormat";
import { orderIdToInvoiceRef } from "@/lib/printInvoice";

const { Text, Title } = Typography;

type DashboardPayload = {
  today: { orderCount: number; revenue: number };
  monthToDate: { orderCount: number; revenue: number };
  last7Days: { date: string; revenue: number; orderCount: number }[];
  catalog: { productCount: number; variantCount: number; lowStockCount: number };
  paymentToday: {
    paymentMethod: string;
    orderCount: number;
    revenue: number;
  }[];
  recentOrders: {
    id: string;
    createdAt: string;
    totalAmount: number;
    paymentMethod: string;
    status: string;
    customerName: string | null;
    customerPhone: string | null;
    itemCount: number;
  }[];
  lowStockVariants: {
    id: string;
    productName: string;
    variantName: string;
    quantity: number;
    minStock: number | null;
  }[];
};

function paymentLabel(raw: string) {
  if (raw === "CASH") return "Cash";
  if (raw === "UPI_CARD") return "UPI / Card";
  return raw || "-";
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

const chartStroke = "var(--ochre-500)";

function DashboardSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pb-6 animate-pulse">
      <div className="shrink-0 px-1 sm:px-0">
        <div className="h-8 w-48 bg-[var(--pearl-bush)] rounded-lg mb-2" />
        <div className="h-4 w-96 bg-[var(--pearl-bush)] opacity-50 rounded" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} variant="borderless" className="h-32 rounded-xl border border-[var(--pearl-bush)] bg-white shadow-sm" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card title="Loading revenue..." variant="borderless" className="rounded-xl border border-[var(--pearl-bush)] shadow-sm lg:col-span-7 xl:col-span-8 h-[360px]" />
        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
          <Card key="p-skele" title="Payment mix" variant="borderless" className="rounded-xl border border-[var(--pearl-bush)] shadow-sm h-[240px]" />
          <Card key="q-skele" title="Quick actions" variant="borderless" className="rounded-xl border border-[var(--pearl-bush)] shadow-sm h-[100px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card title="Recent bills" variant="borderless" className="rounded-xl border border-[var(--pearl-bush)] shadow-sm lg:col-span-12 h-[300px]" />
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";
  const shopKey = effectiveShopCode || defaultShop;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardPayload | null>(null);

  const load = useCallback(async () => {
    if (!shopKey) return;
    setLoading(true);
    try {
      const res = await apiFetch("/analytics/dashboard");
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as DashboardPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [shopKey]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!shopKey) {
    return (
      <Empty description="Select a shop to load the dashboard." className="py-16" />
    );
  }

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <Card className="rounded-xl border-[var(--pearl-bush)] bg-[var(--parchment)]">
        <Empty description="Could not load dashboard. Try again later." />
      </Card>
    );
  }

  const chartData = data.last7Days.map((d) => ({
    ...d,
    label: chartDayLabel(d.date),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 pb-6">
      <div className="shrink-0 px-1 sm:px-0">
        <Title level={2} className="!mb-1 !text-[var(--text-primary)] !text-xl sm:!text-2xl">
          Dashboard
        </Title>
        <Text className="text-[var(--text-secondary)] text-xs sm:text-sm">
          Snapshot of sales, catalogue, and stock for your active shop. Amounts
          and &ldquo;today&rdquo; use UTC calendar days.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          variant="borderless"
          className="h-full rounded-xl border border-[var(--pearl-bush)] bg-gradient-to-br from-[#fffef9] to-[var(--linen-95)] shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--ochre-600)]">
            <IndianRupee className="h-5 w-5" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--bistre-400)]">
              Today
            </span>
          </div>
          <Statistic
            title="Revenue"
            value={data.today.revenue}
            formatter={(v) => formatInrFull(Number(v))}
            styles={{
              content: { color: "var(--bistre-800)", fontWeight: 700 },
            }}
          />
          <Text type="secondary" className="mt-2 block text-sm">
            {data.today.orderCount} bill
            {data.today.orderCount === 1 ? "" : "s"}
          </Text>
        </Card>

        <Card
          variant="borderless"
          className="h-full rounded-xl border border-[var(--pearl-bush)] bg-gradient-to-br from-[#fffef9] to-[var(--linen-95)] shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--ochre-600)]">
            <Receipt className="h-5 w-5" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--bistre-400)]">
              Month to date
            </span>
          </div>
          <Statistic
            title="Revenue"
            value={data.monthToDate.revenue}
            formatter={(v) => formatInrFull(Number(v))}
            styles={{
              content: { color: "var(--bistre-800)", fontWeight: 700 },
            }}
          />
          <Text type="secondary" className="mt-2 block text-sm">
            {data.monthToDate.orderCount} orders this month
          </Text>
        </Card>

        <Card
          variant="borderless"
          className="h-full rounded-xl border border-[var(--pearl-bush)] bg-gradient-to-br from-[#fffef9] to-[var(--linen-95)] shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-[var(--ochre-600)]">
            <Package className="h-5 w-5" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--bistre-400)]">
              Catalogue
            </span>
          </div>
          <Statistic
            title="Products"
            value={data.catalog.productCount}
            styles={{
              content: { color: "var(--bistre-800)", fontWeight: 700 },
            }}
          />
          <Text type="secondary" className="mt-2 block text-sm">
            {data.catalog.variantCount} SKUs ·{" "}
            <Link href="/inventory" className="text-[var(--ochre-600)] hover:underline">
              Inventory
            </Link>
          </Text>
        </Card>

        <Card
          variant="borderless"
          className="h-full rounded-xl border border-[var(--pearl-bush)] bg-gradient-to-br from-[#fffef9] to-[var(--linen-95)] shadow-sm"
        >
          <div className="mb-3 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--bistre-400)]">
              Stock alerts
            </span>
          </div>
          <Statistic
            title="Low or out of stock"
            value={data.catalog.lowStockCount}
            styles={{
              content: {
                color:
                  data.catalog.lowStockCount > 0
                    ? "#b45309"
                    : "var(--bistre-800)",
                fontWeight: 700,
              },
            }}
          />
          <Text type="secondary" className="mt-2 block text-sm">
            Variants at or below minimum
          </Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          title="Revenue - last 7 days"
          variant="borderless"
          className="rounded-xl border border-[var(--pearl-bush)] shadow-sm lg:col-span-7 xl:col-span-8 flex flex-col h-full"
          styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
          extra={
            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ochre-600)] hover:underline"
            >
              Reports <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="flex-1 w-full min-w-0 min-h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartStroke} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartStroke} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pearl-bush)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--bistre-500)" }}
                  axisLine={{ stroke: "var(--bistre-200)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--bistre-500)" }}
                  axisLine={false}
                  tickFormatter={(v) => `₹${Number(v) >= 1000 ? `${(Number(v) / 1000).toFixed(1)}k` : v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "var(--pearl-bush)",
                    background: "#fffef9",
                  }}
                  formatter={(value) => [
                    formatInrFull(Number(value ?? 0)),
                    "Revenue",
                  ]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date
                      ? chartDayLabel(String(payload[0].payload.date))
                      : ""
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartStroke}
                  strokeWidth={2}
                  fill="url(#dashRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4 h-full">
          <Card
            title="Today's payment mix"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm flex-1 flex flex-col"
            styles={{ body: { flex: 1 } }}
          >
            {data.paymentToday.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sales yet today" />
            ) : (
              <Flex vertical gap="middle">
                {data.paymentToday.map((item) => (
                  <div
                    key={item.paymentMethod}
                    className="flex w-full items-center justify-between gap-2"
                  >
                    <Tag
                      color={item.paymentMethod === "CASH" ? "green" : "purple"}
                      className="m-0"
                    >
                      {paymentLabel(item.paymentMethod)}
                    </Tag>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {formatInrFull(item.revenue)}
                      </div>
                      <div className="text-[var(--text-muted)]">
                        {item.orderCount} bill
                        {item.orderCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                ))}
              </Flex>
            )}
          </Card>
          <Card
            title="Quick actions"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <Link
                href="/billing-pos"
                className="flex items-center justify-between rounded-lg border border-[var(--pearl-bush)] bg-[var(--linen-95)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--ochre-300)] hover:bg-[var(--ochre-10)]"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[var(--ochre-600)]" />
                  New sale - Billing POS
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--bistre-400)]" />
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between rounded-lg border border-[var(--pearl-bush)] bg-[var(--linen-95)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--ochre-300)] hover:bg-[var(--ochre-10)]"
              >
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[var(--ochre-600)]" />
                  All orders
                </span>
                <ArrowRight className="h-4 w-4 text-[var(--bistre-400)]" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card
          title="Recent bills"
          variant="borderless"
          className="rounded-xl border border-[var(--pearl-bush)] shadow-sm h-full lg:col-span-7 xl:col-span-7"
          extra={
            <Link href="/orders" className="text-sm text-[var(--ochre-600)] hover:underline">
              View all
            </Link>
          }
        >
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            dataSource={data.recentOrders}
            scroll={{ x: 'max-content' }}
            onRow={(record) => ({
              onClick: () => router.push(`/orders/${record.id}`),
              style: { cursor: "pointer" },
            })}
            columns={[
              {
                title: "When",
                dataIndex: "createdAt",
                render: (iso: string) => formatWhen(iso),
              },
              {
                title: "Ref",
                dataIndex: "id",
                render: (id: string) => (
                  <span className="font-mono text-xs text-[var(--bistre-600)]">
                    {orderIdToInvoiceRef(id)}
                  </span>
                ),
              },
              {
                title: "Customer",
                key: "cust",
                render: (_, row) =>
                  row.customerName?.trim() || row.customerPhone?.trim() ? (
                    <div>
                      <div className="font-medium">
                        {row.customerName?.trim() || "Walk-in"}
                      </div>
                      {row.customerPhone ? (
                        <div className="text-xs text-[var(--text-muted)]">
                          {row.customerPhone}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)]">Walk-in</span>
                  ),
              },
              {
                title: "Total",
                dataIndex: "totalAmount",
                align: "right" as const,
                render: (n: number) => formatInrFull(n),
              },
            ]}
          />
        </Card>

        <Card
          title="Restock soon"
          variant="borderless"
          className="rounded-xl border border-[var(--pearl-bush)] shadow-sm h-full lg:col-span-5 xl:col-span-5"
          extra={
            <Link href="/inventory" className="text-sm text-[var(--ochre-600)] hover:underline">
              Inventory
            </Link>
          }
        >
          {data.lowStockVariants.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="All variants above minimum levels"
            />
          ) : (
            <Flex vertical gap={4}>
              {data.lowStockVariants.map((item) => (
                <Link
                  key={item.id}
                  href={`/inventory/${item.id}`}
                  className="flex w-full items-start justify-between gap-2 rounded-lg border-b border-[var(--pearl-bush)] px-1 py-2 last:border-0 hover:bg-[var(--ochre-10)]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-[var(--text-primary)]">
                      {item.productName}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {item.variantName}
                      {item.minStock != null
                        ? ` · min ${item.minStock}`
                        : ""}
                    </div>
                  </div>
                  <Tag color={item.quantity <= 0 ? "red" : "orange"}>
                    {item.quantity} left
                  </Tag>
                </Link>
              ))}
            </Flex>
          )}
        </Card>
      </div>
      <div className="h-6 shrink-0 w-full"></div>
    </div>
  );
}
