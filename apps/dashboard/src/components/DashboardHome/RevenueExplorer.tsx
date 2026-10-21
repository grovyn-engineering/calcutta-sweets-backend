"use client";

import { Button, Card, Empty, Input, Spin, Statistic, Table, Typography } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import { chartDayLabel, formatInrFull, istDayOffset } from "@/lib/chartFormat";

const { Text } = Typography;

type RevenuePayload = {
  days: number;
  range: { start: string; end: string };
  totals: { orderCount: number; revenue: number };
  daily: { date: string; revenue: number; orderCount: number }[];
};

type Preset = "today" | "yesterday" | "last7" | "custom";

export default function RevenueExplorer() {
  const { effectiveShopCode } = useShop();
  const defaultShop = process.env.NEXT_PUBLIC_API_DEFAULT_SHOP_CODE ?? "";
  const shopKey = effectiveShopCode || defaultShop;

  const today = useMemo(() => istDayOffset(0), []);
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const [preset, setPreset] = useState<Preset>("today");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RevenuePayload | null>(null);

  const applyPreset = useCallback((p: Exclude<Preset, "custom">) => {
    setPreset(p);
    if (p === "today") {
      setStart(istDayOffset(0));
      setEnd(istDayOffset(0));
    } else if (p === "yesterday") {
      setStart(istDayOffset(-1));
      setEnd(istDayOffset(-1));
    } else {
      setStart(istDayOffset(-6));
      setEnd(istDayOffset(0));
    }
  }, []);

  const load = useCallback(async () => {
    if (!shopKey || !start || !end) return;
    if (end < start) {
      setError("End date must be on or after start date.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const params = new URLSearchParams({ start, end });
      const res = await apiFetch(`/analytics/dashboard/revenue?${params}`);
      if (!res.ok) throw new Error(await res.text());
      setData((await res.json()) as RevenuePayload);
    } catch {
      setData(null);
      setError("Could not load revenue for this range.");
    } finally {
      setLoading(false);
    }
  }, [shopKey, start, end]);

  useEffect(() => {
    void load();
  }, [load]);

  const singleDay = data ? data.range.start === data.range.end : start === end;

  return (
    <Card
      variant="borderless"
      className="rounded-xl border border-[var(--pearl-bush)] shadow-sm"
      title={
        <span className="flex items-center gap-2">
          Revenue explorer
        </span>
      }
      extra={
        <Text type="secondary" className="text-xs">
          IST calendar days
        </Text>
      }
    >
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            type={preset === "today" ? "primary" : "default"}
            onClick={() => applyPreset("today")}
          >
            Today
          </Button>
          <Button
            size="small"
            type={preset === "yesterday" ? "primary" : "default"}
            onClick={() => applyPreset("yesterday")}
          >
            Yesterday
          </Button>
          <Button
            size="small"
            type={preset === "last7" ? "primary" : "default"}
            onClick={() => applyPreset("last7")}
          >
            Last 7 days
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col">
            <Text className="text-[11px] text-[var(--text-secondary)]">From</Text>
            <Input
              type="date"
              size="small"
              max={end || undefined}
              value={start}
              onChange={(e) => {
                setPreset("custom");
                setStart(e.target.value);
              }}
              className="min-w-[150px]"
            />
          </div>
          <div className="flex flex-col">
            <Text className="text-[11px] text-[var(--text-secondary)]">To</Text>
            <Input
              type="date"
              size="small"
              min={start || undefined}
              value={end}
              onChange={(e) => {
                setPreset("custom");
                setEnd(e.target.value);
              }}
              className="min-w-[150px]"
            />
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex min-h-[140px] items-center justify-center">
          <Spin />
        </div>
      ) : error ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error} />
      ) : !data ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No data." />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[var(--border)]">
            <div className="sm:px-6 sm:first:pl-0">
              <Statistic
                title={
                  singleDay
                    ? `Revenue · ${chartDayLabel(data.range.start)}`
                    : `Revenue · ${chartDayLabel(data.range.start)} – ${chartDayLabel(data.range.end)}`
                }
                value={data.totals.revenue}
                formatter={(v) => formatInrFull(Number(v))}
                styles={{ content: { color: "var(--text-primary)", fontWeight: 600 } }}
              />
            </div>
            <div className="sm:px-6 sm:first:pl-0">
              <Statistic
                title="Bills"
                value={data.totals.orderCount}
                styles={{ content: { color: "var(--text-primary)", fontWeight: 600 } }}
              />
            </div>
            <div className="sm:px-6 sm:first:pl-0">
              <Statistic
                title={data.days === 1 ? "Day" : "Avg / day"}
                value={
                  data.days === 1
                    ? 1
                    : data.totals.revenue / data.days
                }
                formatter={(v) =>
                  data.days === 1 ? "1 day" : formatInrFull(Number(v))
                }
                styles={{ content: { color: "var(--text-primary)", fontWeight: 600 } }}
              />
            </div>
          </div>

          {!singleDay && (
            <Table
              size="small"
              pagination={false}
              rowKey="date"
              dataSource={data.daily}
              scroll={{ x: "max-content", y: 260 }}
              columns={[
                {
                  title: "Date",
                  dataIndex: "date",
                  render: (d: string) => chartDayLabel(d),
                },
                {
                  title: "Bills",
                  dataIndex: "orderCount",
                  align: "right" as const,
                },
                {
                  title: "Revenue",
                  dataIndex: "revenue",
                  align: "right" as const,
                  render: (n: number) => formatInrFull(n),
                },
              ]}
            />
          )}
        </div>
      )}
    </Card>
  );
}
