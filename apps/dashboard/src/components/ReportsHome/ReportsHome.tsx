"use client";

import {
  App,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Row,
  Segmented,
  Spin,
  Statistic,
  Table,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart as PieChartIcon,
} from "lucide-react";

import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import { chartDayLabel, formatInrFull } from "@/lib/chartFormat";
import {
  downloadReportsExcel,
  downloadReportsPdf,
  type ReportsExportPayload,
} from "@/lib/reportsExport";
import { antTableOverflowComponents } from "@/components/AntTableOverflowCell/AntTableOverflowCell";
import ReportsOrdersTabulator from "@/components/ReportsOrdersTabulator/ReportsOrdersTabulator";

const { Text, Title } = Typography;

type ReportsPayload = {
  days: number;
  range: { start: string; end: string };
  totals: { orderCount: number; revenue: number };
  daily: { date: string; revenue: number; orderCount: number }[];
  paymentMix: {
    paymentMethod: string;
    orderCount: number;
    revenue: number;
  }[];
  topProducts: { productName: string; qtySold: number; revenue: number }[];
};

function paymentLabel(raw: string) {
  if (raw === "CASH") return "Cash";
  if (raw === "UPI_CARD") return "UPI / Card";
  return raw || "Other";
}

const PIE_COLORS = ["#c9932d", "#6b4a30", "#8b7355", "#a67c23", "#4e3420"];

export type ReportsHomeProps = {
  variant?: "full" | "embedded";
};

export default function ReportsHome({ variant = "full" }: ReportsHomeProps) {
  const embedded = variant === "embedded";
  const showSummaryCards = !embedded;
  const showDailyRevenueChart = !embedded;
  const { message } = App.useApp();
  const { effectiveShopCode, shops } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";
  const shopKey = effectiveShopCode || defaultShop;

  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportsPayload | null>(null);
  const [exportBusy, setExportBusy] = useState<"xlsx" | "pdf" | null>(null);

  const shopDisplayName = useMemo(() => {
    const row = shops.find((s) => s.shopCode === shopKey);
    return row?.name?.trim() || shopKey;
  }, [shops, shopKey]);

  const load = useCallback(async () => {
    if (!shopKey) return;
    setLoading(true);
    try {
      const res = await apiFetch(
        `/analytics/reports/summary?days=${encodeURIComponent(String(days))}`,
      );
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as ReportsPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [shopKey, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const exportMenuItems = useMemo<MenuProps["items"]>(
    () => [
      {
        key: "xlsx",
        label: "Excel (.xlsx)",
        icon: <FileSpreadsheet className="h-4 w-4" aria-hidden />,
      },
      {
        key: "pdf",
        label: "PDF",
        icon: <FileText className="h-4 w-4" aria-hidden />,
      },
    ],
    [],
  );

  const handleExport = useCallback(
    async (kind: "xlsx" | "pdf") => {
      if (!shopKey) return;
      setExportBusy(kind);
      try {
        const res = await apiFetch(
          `/analytics/reports/export-data?days=${encodeURIComponent(String(days))}`,
        );
        if (!res.ok) {
          throw new Error((await res.text()) || res.statusText);
        }
        const payload = (await res.json()) as ReportsExportPayload;
        if (kind === "xlsx") {
          await downloadReportsExcel(payload, shopDisplayName, shopKey);
        } else {
          await downloadReportsPdf(payload, shopDisplayName, shopKey);
        }
        message.success(
          kind === "xlsx"
            ? "Excel file downloaded."
            : "PDF downloaded.",
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Export failed.";
        message.error(msg);
      } finally {
        setExportBusy(null);
      }
    },
    [days, message, shopDisplayName, shopKey],
  );

  const barData = useMemo(() => {
    if (!data) return [];
    return data.daily.map((d) => ({
      ...d,
      label: chartDayLabel(d.date),
    }));
  }, [data]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.paymentMix.map((p) => ({
      name: paymentLabel(p.paymentMethod),
      value: p.revenue,
      orders: p.orderCount,
    }));
  }, [data]);

  if (!shopKey) {
    return (
      <Empty description="Select a shop to load reports." className="py-16" />
    );
  }

  return (
    <div className={`flex min-h-0 flex-1 flex-col gap-6 ${embedded ? "pb-6" : ""}`}>
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Title
            level={embedded ? 4 : 2}
            className={`!mb-1 !text-[var(--text-primary)] ${embedded ? "!text-lg sm:!text-xl" : ""}`}
          >
            {embedded ? "Analytics & reports" : "Reports"}
          </Title>
          <Text className="text-[var(--text-secondary)] text-xs sm:text-sm">
            {embedded
              ? "Deep-dive analytics: payment behavior, top products, and searchable order history."
              : "Sales trends, payment mix, top products, and searchable order history. Daily buckets use UTC dates."}
          </Text>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Dropdown
            menu={{
              items: exportMenuItems,
              onClick: ({ key }) =>
                void handleExport(key as "xlsx" | "pdf"),
            }}
            disabled={!shopKey || loading || !data || !!exportBusy}
            trigger={["click"]}
          >
            <Button
              type="default"
              icon={<Download className="h-4 w-4" aria-hidden />}
              loading={!!exportBusy}
            >
              Export report
            </Button>
          </Dropdown>
          <Segmented
            options={[
              { label: "7 days", value: 7 },
              { label: "30 days", value: 30 },
              { label: "90 days", value: 90 },
            ]}
            value={days}
            onChange={(v) => setDays(v as number)}
          />
        </div>
      </div>

      {loading && !data ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <Spin size="large" />
        </div>
      ) : !data ? (
        <Card className="rounded-xl border-[var(--pearl-bush)]">
          <Empty description="Could not load reports." />
        </Card>
      ) : (
        <>
          {showSummaryCards ? (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  variant="borderless"
                  className="rounded-xl border border-[var(--pearl-bush)] bg-[rgba(255,254,249,0.5)] shadow-sm"
                >
                  <Statistic
                    title={`Revenue (${data.days}d)`}
                    value={data.totals.revenue}
                    formatter={(v) => formatInrFull(Number(v))}
                    styles={{
                      content: { color: "var(--bistre-800)", fontWeight: 700 },
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  variant="borderless"
                  className="rounded-xl border border-[var(--pearl-bush)] bg-[rgba(255,254,249,0.5)] shadow-sm"
                >
                  <Statistic
                    title="Bills"
                    value={data.totals.orderCount}
                    styles={{
                      content: { color: "var(--bistre-800)", fontWeight: 700 },
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  variant="borderless"
                  className="rounded-xl border border-[var(--pearl-bush)] bg-[rgba(255,254,249,0.5)] shadow-sm"
                >
                  <Statistic
                    title="Avg. bill value"
                    value={
                      data.totals.orderCount > 0
                        ? data.totals.revenue / data.totals.orderCount
                        : 0
                    }
                    formatter={(v) => formatInrFull(Number(v))}
                    styles={{
                      content: { color: "var(--bistre-800)", fontWeight: 700 },
                    }}
                  />
                </Card>
              </Col>
            </Row>
          ) : null}

          <Row gutter={[16, 16]} className="items-stretch">
            {showDailyRevenueChart ? (
              <Col xs={24} xl={14} className="flex flex-col">
                <Card
                  title={
                    <span className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-[var(--ochre-600)]" />
                      Daily revenue
                    </span>
                  }
                  variant="borderless"
                  className="flex flex-col h-full rounded-xl border border-[var(--pearl-bush)] shadow-sm"
                  styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
                >
                  <div className="flex-1 w-full min-w-0 min-h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--pearl-bush)" />
                        <XAxis
                          dataKey="label"
                          interval="preserveStartEnd"
                          tick={{ fontSize: 10, fill: "var(--bistre-500)" }}
                          axisLine={{ stroke: "var(--bistre-200)" }}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--bistre-500)" }}
                          axisLine={false}
                          width={48}
                          tickFormatter={(v) =>
                            Number(v) >= 1000
                              ? `₹${(Number(v) / 1000).toFixed(1)}k`
                              : `₹${v}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            borderColor: "var(--pearl-bush)",
                            background: "#fffef9",
                          }}
                          formatter={(value, name) => {
                            if (name === "revenue")
                              return [
                                formatInrFull(Number(value ?? 0)),
                                "Revenue",
                              ];
                            return [value ?? "", String(name)];
                          }}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.date
                              ? chartDayLabel(String(payload[0].payload.date))
                              : ""
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          name="revenue"
                          fill="var(--ochre-500)"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </Col>
            ) : null}
            <Col xs={24} xl={showDailyRevenueChart ? 10 : 24} className="flex flex-col">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-[var(--ochre-600)]" />
                    {embedded ? "Payment mix (selected range)" : "Revenue by payment mode"}
                  </span>
                }
                variant="borderless"
                className="flex flex-col h-full rounded-xl border border-[var(--pearl-bush)] shadow-sm"
                styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
              >
                <div className="flex-1 w-full min-w-0 min-h-[320px] flex items-center justify-center">
                  {pieData.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="No sales in this range"
                      className="py-8"
                    />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={88}
                          paddingAngle={2}
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={String(i)}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 10,
                            borderColor: "var(--pearl-bush)",
                            background: "#fffef9",
                          }}
                          formatter={(value, _name, item) => {
                            const o = item?.payload as {
                              orders?: number;
                            };
                            return [
                              `${formatInrFull(Number(value ?? 0))} (${o?.orders ?? 0} bills)`,
                              "Revenue",
                            ];
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </Col>
          </Row>

          <Card
            title="Top products by revenue"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
            extra={
              <Link
                href="/products"
                className="text-sm text-[var(--ochre-600)] hover:underline"
              >
                Manage products
              </Link>
            }
          >
            {data.topProducts.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No line items in this period"
              />
            ) : (
              <Table
                size="small"
                pagination={{ pageSize: 10, showSizeChanger: false }}
                rowKey="productName"
                components={antTableOverflowComponents}
                dataSource={data.topProducts}
                columns={[
                  {
                    title: "Product",
                    dataIndex: "productName",
                    ellipsis: true,
                  },
                  {
                    title: "Qty sold",
                    dataIndex: "qtySold",
                    width: 100,
                    align: "right" as const,
                  },
                  {
                    title: "Revenue",
                    dataIndex: "revenue",
                    width: 140,
                    align: "right" as const,
                    render: (n: number) => formatInrFull(n),
                  },
                ]}
              />
            )}
          </Card>

          <Card
            title="Order register"
            variant="borderless"
            className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
            extra={
              <Link href="/orders" className="text-sm text-[var(--ochre-600)] hover:underline">
                Open orders page
              </Link>
            }
          >
            <Text type="secondary" className="mb-3 block text-sm">
              Click a row to open bill details. Same data as the Orders list.
            </Text>
            <div className="max-h-[550px]">
              <ReportsOrdersTabulator />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
