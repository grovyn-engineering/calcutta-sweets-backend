"use client";

import {
  Card,
  Col,
  Empty,
  Flex,
  Row,
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
  return raw || "—";
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
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spin size="large" />
      </div>
    );
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
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <div className="shrink-0">
        <Title level={2} className="!mb-1 !text-[var(--text-primary)]">
          Dashboard
        </Title>
        <Text className="text-[var(--text-secondary)]">
          Snapshot of sales, catalogue, and stock for your active shop. Amounts
          and &ldquo;today&rdquo; use UTC calendar days.
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
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
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card
            title="Revenue — last 7 days"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
            extra={
              <Link
                href="/reports"
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--ochre-600)] hover:underline"
              >
                Reports <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="h-[280px] w-full min-w-0">
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
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title="Today's payment mix"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
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
            className="mt-4 rounded-xl border border-[var(--pearl-bush)] shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <Link
                href="/billing-pos"
                className="flex items-center justify-between rounded-lg border border-[var(--pearl-bush)] bg-[var(--linen-95)] px-3 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--ochre-300)] hover:bg-[var(--ochre-10)]"
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-[var(--ochre-600)]" />
                  New sale — Billing POS
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
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Recent bills"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
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
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title="Restock soon"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
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
        </Col>
      </Row>
    </div>
  );
}
