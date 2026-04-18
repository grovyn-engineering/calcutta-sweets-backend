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
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { Printer, Receipt, Store, UserRound } from "lucide-react";
import type { ColumnDefinition, ReactTabulatorOptions } from "react-tabulator";

import { DataTable } from "@/components/DataTable/DataTable";
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import {
  openPrintableInvoice,
  orderIdToInvoiceRef,
  type InvoicePrintFormat,
} from "@/lib/printInvoice";

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

type OrderLineTabRow = OrderDetailItem & {
  id: string;
  unitResolved: string;
  lineTotal: number;
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

  const lineColumns = useMemo<ColumnDefinition[]>(
    () => [
      {
        title: "Item",
        field: "productName",
        minWidth: 200,
        headerSort: false,
        cssClass: styles.lineItemProductCol,
        formatter: (cell) => {
          const row = cell.getRow().getData() as OrderLineTabRow;
          const wrap = document.createElement("div");
          wrap.className = styles.lineItemProductStack;
          const title = document.createElement("div");
          title.className = styles.lineItemTitle;
          title.textContent = row.productName ?? "";
          wrap.appendChild(title);
          if (row.variantLabel?.trim() && row.variantLabel !== "-") {
            const sub = document.createElement("div");
            sub.className = styles.lineItemSub;
            sub.textContent = row.variantLabel;
            wrap.appendChild(sub);
          }
          if (row.barcode?.trim()) {
            const code = document.createElement("div");
            code.className = styles.lineItemCode;
            code.textContent = row.barcode;
            code.title = `Barcode: ${row.barcode}`;
            wrap.appendChild(code);
          }
          return wrap;
        },
      },
      {
        title: "Qty",
        field: "quantity",
        width: 88,
        hozAlign: "right",
        headerSort: false,
        cssClass: styles.lineItemNumCol,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = styles.tabularCell;
          const n = Number(cell.getValue());
          span.textContent = Number.isFinite(n)
            ? n.toLocaleString("en-IN", { maximumFractionDigits: 3 })
            : String(cell.getValue() ?? "");
          return span;
        },
      },
      {
        title: "Unit",
        field: "unitResolved",
        width: 80,
        hozAlign: "center",
        headerSort: false,
      },
      {
        title: "Rate",
        field: "unitPrice",
        width: 112,
        hozAlign: "right",
        headerSort: false,
        cssClass: styles.lineItemNumCol,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = styles.tabularCell;
          span.textContent = inr.format(Number(cell.getValue()) || 0);
          return span;
        },
      },
      {
        title: "Amount",
        field: "lineTotal",
        width: 120,
        hozAlign: "right",
        headerSort: false,
        cssClass: styles.lineItemNumCol,
        formatter: (cell) => {
          const span = document.createElement("span");
          span.className = styles.lineItemAmount;
          span.textContent = inr.format(Number(cell.getValue()) || 0);
          return span;
        },
      },
    ],
    [],
  );

  const handlePrint = (format: InvoicePrintFormat) => {
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
    const ok = openPrintableInvoice(
      {
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
      },
      format,
    );
    if (!ok) {
      message.error("Pop-up blocked. Allow pop-ups to print this bill.");
    }
  };

  const tableData: OrderLineTabRow[] = useMemo(() => {
    if (!order?.items.length) return [];
    return order.items.map((line, idx) => ({
      ...line,
      id: `${order.id}-${idx}`,
      unitResolved: line.unit?.trim() || "PC",
      lineTotal: line.quantity * line.unitPrice,
    }));
  }, [order]);

  const lineCount = order?.items.length ?? 0;

  const lineTableOptions = useMemo<ReactTabulatorOptions>(() => {
    const bodyCap = Math.min(
      linesBodyMaxHeight,
      Math.max(220, 52 + Math.max(1, lineCount) * 48),
    );
    return {
      layout: "fitColumns",
      maxHeight: bodyCap,
      placeholder: "No line items on this bill.",
      selectable: false,
    };
  }, [linesBodyMaxHeight, lineCount]);

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
              <Tooltip title="Full invoice on A4 / PDF-style layout">
                <Button
                  type="primary"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={() => handlePrint("a4")}
                  style={{
                    backgroundColor: "var(--ochre-600)",
                    borderColor: "var(--ochre-600)",
                  }}
                >
                  Print invoice (A4)
                </Button>
              </Tooltip>
              <Tooltip title="Narrow layout for 80mm thermal printers">
                <Button
                  icon={<Receipt className="h-4 w-4" />}
                  onClick={() => handlePrint("receipt")}
                >
                  Print receipt
                </Button>
              </Tooltip>
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

              <div className={styles.linesSection}>
                <div className={styles.linesSectionHead}>
                  <span className={styles.linesSectionTitle}>Line items</span>
                  <span className={styles.linesSectionCount}>({lineCount})</span>
                </div>
                <div className={styles.lineItemsTableHost}>
                  <DataTable
                    key={order.id}
                    columns={lineColumns}
                    data={tableData}
                    options={lineTableOptions}
                    loading={false}
                    minHeight={450}
                    emptyTitle="No line items"
                    emptyDescription="This bill has no products attached."
                  />
                  {order && lineCount > 0 ? (
                    <div className={styles.linesFooter} role="rowgroup">
                      <div className={styles.linesFooterLead} aria-hidden />
                      <div className={styles.linesFooterMeta}>
                        <Text strong className={styles.linesFooterMetaTitle}>
                          Payable total
                        </Text>
                        <Text
                          type="secondary"
                          className={styles.linesFooterMetaHint}
                        >
                          Incl. GST & discount · {lineCount} line
                          {lineCount === 1 ? "" : "s"}
                        </Text>
                      </div>
                      <div className={styles.linesFooterGrand}>
                        {inr.format(order.totalAmount)}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
