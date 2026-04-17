"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Printer, Receipt, Store, UserRound } from "lucide-react";

import { antTableOverflowComponents } from "@/components/AntTableOverflowCell/AntTableOverflowCell";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import { openPrintableInvoice, orderIdToInvoiceRef } from "@/lib/printInvoice";

import styles from "./bill-detail.module.css";

const { Text, Title } = Typography;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

type OrderDetailItem = {
  quantity: number;
  unitPrice: number;
  productName: string;
  variantLabel: string;
  unit: string | null;
  barcode: string;
};

type OrderDetail = {
  id: string;
  createdAt: string;
  paymentMethod: string;
  totalAmount: number;
  tax: number;
  discount: number;
  status: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  subtotal: number;
  items: OrderDetailItem[];
};

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

function paymentLabel(raw: string) {
  if (raw === "CASH") return "Cash";
  if (raw === "UPI_CARD") return "UPI / Card";
  return raw || "-";
}

function paymentTagColor(raw: string): string {
  if (raw === "CASH") return "green";
  if (raw === "UPI_CARD") return "purple";
  return "default";
}

function statusTagColor(status: string): string {
  const u = status.toUpperCase();
  if (u === "PAID") return "success";
  if (u === "PENDING" || u === "OPEN") return "warning";
  if (u === "CANCELLED" || u === "REFUNDED") return "error";
  return "processing";
}

export default function OrderBillDetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;
  const { shops, effectiveShopCode } = useShop();
  const shopName = useMemo(
    () =>
      shops.find((s) => s.shopCode === effectiveShopCode)?.name ??
      "Calcutta Sweets",
    [shops, effectiveShopCode],
  );

  const currentShop = shops.find((s) => s.shopCode === effectiveShopCode);
  const totalTaxRate = ((currentShop?.cgstRate ?? 2.5) + (currentShop?.sgstRate ?? 2.5)) / 100;

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [linesBodyMaxHeight, setLinesBodyMaxHeight] = useState(400);

  useEffect(() => {
    const measure = () => {
      if (typeof window === "undefined") return;
      const layoutReservePx = 460;
      const y = Math.max(200, Math.min(720, window.innerHeight - layoutReservePx));
      setLinesBodyMaxHeight(y);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/orders/${encodeURIComponent(orderId)}`);
      if (!res.ok) {
        if (res.status === 404) {
          message.error("Bill not found");
          router.push("/orders");
          return;
        }
        const t = await res.text();
        message.error(t || res.statusText);
        return;
      }
      setOrder((await res.json()) as OrderDetail);
    } catch (e) {
      message.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [orderId, message, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const invoiceRef = order ? orderIdToInvoiceRef(order.id) : "…";

  const lineColumns: ColumnsType<OrderDetailItem & { key: number }> = useMemo(
    () => [
      {
        title: "Item",
        key: "item",
        render: (_, line) => (
          <div className="min-w-0 max-w-[min(100%,280px)] py-0.5">
            <Text strong className="text-[var(--text-primary)]">
              {line.productName}
            </Text>
            {line.variantLabel && line.variantLabel !== "-" ? (
              <div>
                <Text type="secondary" className="text-xs leading-snug">
                  {line.variantLabel}
                </Text>
              </div>
            ) : null}
            {line.barcode ? (
              <Tooltip title={`Barcode: ${line.barcode}`}>
                <Text
                  type="secondary"
                  className="mt-0.5 block max-w-full break-words font-mono text-[10px] leading-snug opacity-70"
                >
                  {line.barcode}
                </Text>
              </Tooltip>
            ) : null}
          </div>
        ),
      },
      {
        title: "Qty",
        dataIndex: "quantity",
        width: 72,
        align: "right",
        className: "tabular-nums",
      },
      {
        title: "Unit",
        key: "unit",
        width: 72,
        align: "center",
        render: (_, line) => line.unit ?? "PC",
      },
      {
        title: "Rate",
        key: "rate",
        width: 112,
        align: "right",
        className: "tabular-nums",
        render: (_, line) => inr.format(line.unitPrice),
      },
      {
        title: "Amount",
        key: "amount",
        width: 120,
        align: "right",
        className: "tabular-nums",
        render: (_, line) => (
          <Text strong className="text-[var(--bistre-800)]">
            {inr.format(line.quantity * line.unitPrice)}
          </Text>
        ),
      },
    ],
    [],
  );

  const handlePrint = () => {
    if (!order) return;
    const customer =
      order.customerName?.trim() || order.customerPhone?.trim()
        ? {
          name: order.customerName?.trim() || "Walk-in",
          phone: order.customerPhone?.trim() ?? "",
          ...(order.customerEmail?.trim()
            ? { email: order.customerEmail.trim() }
            : {}),
        }
        : null;
    const ok = openPrintableInvoice({
      shopName,
      shopCode: effectiveShopCode ?? "-",
      invoiceNo: orderIdToInvoiceRef(order.id),
      issuedAt: order.createdAt,
      customer,
      lines: order.items.map((i) => ({
        name: i.productName,
        variantLabel: i.variantLabel,
        barcode: i.barcode,
        quantity: i.quantity,
        unit: i.unit ?? "PC",
        unitPrice: i.unitPrice,
      })),
      subtotal: order.subtotal,
      gstRate: totalTaxRate,
      gstAmount: order.tax,
      discount: order.discount,
      total: order.totalAmount,
    });
    if (!ok) {
      message.error("Pop-up blocked. Allow pop-ups to print this bill.");
    }
  };

  const tableData =
    order?.items.map((line, idx) => ({ ...line, key: idx })) ?? [];

  const lineCount = order?.items.length ?? 0;
  const tableScroll = {
    y: linesBodyMaxHeight,
    x: "max-content" as const,
  };
  const tableSize = lineCount > 14 ? ("small" as const) : ("middle" as const);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto pb-2">
      <Breadcrumb
        className="shrink-0 text-sm"
        items={[
          {
            title: (
              <Link
                href="/dashboard"
                className="text-[var(--ochre-600)] hover:underline"
              >
                Home
              </Link>
            ),
          },
          {
            title: (
              <Link
                href="/orders"
                className="text-[var(--ochre-600)] hover:underline"
              >
                Orders
              </Link>
            ),
          },
          {
            title: (
              <span className="text-[var(--text-secondary)]">
                Bill {invoiceRef}
              </span>
            ),
          },
        ]}
      />

      {loading && !order ? (
        <ContentSkeleton variant="detail" rowCount={10} />
      ) : order ? (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                <Title
                  level={2}
                  className="!mb-0 !mt-0 !leading-tight !text-[var(--text-primary)]"
                >
                  Bill {invoiceRef}
                </Title>
                <Tag
                  color={statusTagColor(order.status)}
                  className="m-0 shrink-0 uppercase"
                >
                  {order.status}
                </Tag>
                <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                  <Receipt
                    className="h-3.5 w-3.5 shrink-0 text-[var(--bistre-400)]"
                    aria-hidden
                  />
                  {formatWhen(order.createdAt)}
                </span>
                <span className="shrink-0 text-[var(--bistre-200)]" aria-hidden>
                  ·
                </span>
                <Tag
                  color={paymentTagColor(order.paymentMethod)}
                  className="m-0 shrink-0"
                >
                  {paymentLabel(order.paymentMethod)}
                </Tag>
              </div>
            </div>
            <Space wrap className="shrink-0">
              <Button onClick={() => router.push("/orders")}>
                Back to orders
              </Button>
              <Button
                type="primary"
                icon={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
                style={{
                  backgroundColor: "var(--ochre-600)",
                  borderColor: "var(--ochre-600)",
                }}
              >
                Print bill
              </Button>
            </Space>
          </div>

          <Card
            variant="borderless"
            className="min-w-0 rounded-xl border border-[var(--pearl-bush)] bg-[rgba(255,254,249,0.55)] shadow-sm"
            styles={{
              body: { padding: 0 },
            }}
          >
            <div className="border-b border-[var(--pearl-bush)] bg-gradient-to-r from-[var(--linen-95)] to-[rgba(255,254,249,0.9)] px-5 py-3.5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Store className="h-4 w-4 shrink-0 text-[var(--ochre-600)]" aria-hidden />
                <span className="font-semibold text-[var(--text-primary)]">
                  {shopName}
                </span>
                {effectiveShopCode ? (
                  <>
                    <span className="text-[var(--bistre-200)]">·</span>
                    <Text type="secondary" className="font-mono text-xs">
                      {effectiveShopCode}
                    </Text>
                  </>
                ) : null}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <Row gutter={[24, 24]} align="stretch">
                <Col xs={24} lg={14}>
                  <div className="flex h-full flex-col rounded-xl border border-[var(--pearl-bush)] bg-[var(--linen-100)]/80 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--bistre-400)]">
                      <UserRound className="h-3.5 w-3.5" aria-hidden />
                      Customer
                    </div>
                    {order.customerName?.trim() ||
                      order.customerPhone?.trim() ? (
                      <div>
                        <Text className="text-base font-semibold text-[var(--text-primary)]">
                          {order.customerName?.trim() || "Walk-in"}
                        </Text>
                        {order.customerPhone ? (
                          <div className="mt-1 font-mono text-sm text-[var(--text-muted)]">
                            {order.customerPhone}
                          </div>
                        ) : null}
                        {order.customerEmail?.trim() ? (
                          <div className="mt-2 text-sm text-[var(--text-secondary)]">
                            {order.customerEmail}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Text type="secondary" className="italic">
                        Walk-in customer
                      </Text>
                    )}
                  </div>
                </Col>
                <Col xs={24} lg={10}>
                  <div className="flex h-full flex-col justify-center rounded-xl border-2 border-[var(--ochre-20)] bg-[var(--linen-95)] p-4 sm:p-5">
                    <Text
                      type="secondary"
                      className="mb-3 text-[10px] font-bold uppercase tracking-wider"
                    >
                      Summary
                    </Text>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                        <span>Items Total (Incl. Tax)</span>
                        <span className="tabular-nums font-medium text-[var(--text-primary)]">
                          {inr.format(order.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                        <span>CGST</span>
                        <span className="tabular-nums font-medium text-[var(--text-primary)]">
                          {inr.format(order.tax / 2)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                        <span>SGST</span>
                        <span className="tabular-nums font-medium text-[var(--text-primary)]">
                          {inr.format(order.tax / 2)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4 text-[var(--text-secondary)]">
                        <span>Discount</span>
                        <span className="tabular-nums font-medium text-[var(--text-primary)]">
                          {inr.format(order.discount)}
                        </span>
                      </div>
                    </div>
                    <Divider className="my-3 border-[var(--pearl-bush)]" />
                    <div className="flex items-baseline justify-between gap-4">
                      <Text strong className="text-base text-[var(--text-primary)]">
                        Payable total
                      </Text>
                      <Text
                        className="!text-2xl !font-bold !text-[var(--bistre-800)] tabular-nums"
                      >
                        {inr.format(order.totalAmount)}
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>

              <Divider className="my-6 border-[var(--pearl-bush)]" />

              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <Text className="text-[10px] font-bold uppercase tracking-wider text-[var(--bistre-700)]">
                  Line items
                  {order ? (
                    <span className="ml-1.5 font-mono font-normal normal-case text-[var(--bistre-600)]">
                      ({order.items.length})
                    </span>
                  ) : null}
                </Text>
              </div>
              <div className={`${styles.linesWrap} ${styles.linesWrapScroll}`}>
                <Table<OrderDetailItem & { key: number }>
                  size={tableSize}
                  pagination={false}
                  components={antTableOverflowComponents}
                  columns={lineColumns}
                  dataSource={tableData}
                  scroll={tableScroll}
                  rowClassName={() => "align-top"}
                  summary={() =>
                    order ? (
                      <Table.Summary fixed="bottom">
                        <Table.Summary.Row className={styles.summaryRow}>
                          <Table.Summary.Cell index={0} colSpan={4} align="right">
                            <div>
                              <Text strong className="text-[var(--text-primary)]">
                                Payable total
                              </Text>
                              <div>
                                <Text
                                  type="secondary"
                                  className="text-[11px] leading-tight"
                                >
                                  Incl. GST & discount · {order.items.length} line
                                  {order.items.length === 1 ? "" : "s"}
                                </Text>
                              </div>
                            </div>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1} align="right">
                            <Text
                              strong
                              className="!text-lg tabular-nums !text-[var(--bistre-800)]"
                            >
                              {inr.format(order.totalAmount)}
                            </Text>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      </Table.Summary>
                    ) : null
                  }
                />
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
