'use client';

import { Button, Checkbox, Form, Input, InputNumber } from 'antd';
import { FileText } from 'lucide-react';
import { memo, useCallback } from 'react';
import styles from './BillingPosRawSection.module.css';

export type RawBillFormValues = {
  itemName: string;
  unitPrice: number;
  quantity: number;
  customerName: string;
  includeCustomerGstin: boolean;
  customerGstin: string;
};

export const RAW_BILL_FORM_INITIAL: RawBillFormValues = {
  itemName: '',
  unitPrice: 0,
  quantity: 1,
  customerName: '',
  includeCustomerGstin: false,
  customerGstin: '',
};

export type BillingPosRawSectionProps = {
  formValues: RawBillFormValues;
  onFormChange: (next: RawBillFormValues) => void;
  onAddLine: (values: Pick<RawBillFormValues, 'itemName' | 'unitPrice' | 'quantity'>) => void;
  showToolbarAddCustomer?: boolean;
  onToolbarAddCustomer?: () => void;
  showSaleCheckoutHint?: boolean;
};

function BillingPosRawSectionInner({
  formValues,
  onFormChange,
  onAddLine,
  showToolbarAddCustomer,
  onToolbarAddCustomer,
  showSaleCheckoutHint,
}: BillingPosRawSectionProps) {
  const patch = useCallback(
    (partial: Partial<RawBillFormValues>) => {
      onFormChange({ ...formValues, ...partial });
    },
    [formValues, onFormChange],
  );

  const handleAdd = useCallback(() => {
    const name = formValues.itemName.trim();
    const price = Number(formValues.unitPrice);
    const qty = Number(formValues.quantity);
    if (!name) return;
    if (!Number.isFinite(price) || price < 0) return;
    if (!Number.isFinite(qty) || qty < 0.000001) return;
    onAddLine({ itemName: name, unitPrice: price, quantity: qty });
    patch({
      itemName: '',
      unitPrice: 0,
      quantity: 1,
    });
  }, [formValues, onAddLine, patch]);

  return (
    <div className={`min-h-0 flex-1 overflow-auto p-3 sm:p-5 ${styles.wrap}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--ochre-100)] text-[var(--ochre-600)] sm:h-11 sm:w-11">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-[var(--bistre-800)]">
              Raw bill (manual lines)
            </h2>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs sm:leading-relaxed">
              Enter a label and price for items not in the catalog. Bills print with tax split like
              other sales, but lines are not saved against stock. Use Standard or Instant billing to
              deduct inventory.
            </p>
          </div>
        </div>
        {showToolbarAddCustomer && onToolbarAddCustomer ? (
          <Button type="default" size="small" onClick={onToolbarAddCustomer}>
            Full customer…
          </Button>
        ) : null}
      </div>

      <Form layout="vertical" requiredMark={false} className={styles.form}>
        <div className={styles.rowTwo}>
          <Form.Item
            label={<span className={styles.label}>Item name</span>}
            className={styles.grow}
          >
            <Input
              placeholder="e.g. Custom tray — assorted"
              value={formValues.itemName}
              onChange={(e) => patch({ itemName: e.target.value })}
              maxLength={200}
            />
          </Form.Item>
          <Form.Item label={<span className={styles.label}>Price (₹, incl. tax)</span>}>
            <InputNumber
              className="w-full min-w-0"
              min={0}
              value={formValues.unitPrice || null}
              onChange={(v) => patch({ unitPrice: v ?? 0 })}
              placeholder="0"
            />
          </Form.Item>
          <Form.Item label={<span className={styles.label}>Qty</span>}>
            <InputNumber
              className="w-full min-w-0"
              min={0.000001}
              step={1}
              value={formValues.quantity || null}
              onChange={(v) => patch({ quantity: v ?? 1 })}
            />
          </Form.Item>
        </div>

        <div className={styles.sectionLabel}>Customer on bill</div>
        <Form.Item label={<span className={styles.label}>Customer name</span>}>
          <Input
            placeholder="Shown on printed bill (optional)"
            value={formValues.customerName}
            onChange={(e) => patch({ customerName: e.target.value })}
            maxLength={120}
          />
        </Form.Item>
        <div className="mb-3 rounded-lg border border-[var(--pearl-bush)] bg-[var(--parchment)] px-3 py-2.5">
          <Checkbox
            checked={formValues.includeCustomerGstin}
            onChange={(e) => patch({ includeCustomerGstin: e.target.checked })}
            className="text-sm text-[var(--text-secondary)]"
          >
            Include customer GSTIN on printed bill
          </Checkbox>
          {formValues.includeCustomerGstin ? (
            <div className="mt-2">
              <Input
                placeholder="15-character GSTIN"
                value={formValues.customerGstin}
                onChange={(e) =>
                  patch({
                    customerGstin: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15),
                  })
                }
                maxLength={15}
                className="font-mono text-sm"
              />
            </div>
          ) : null}
        </div>

        <Button
          type="primary"
          className="w-full sm:w-auto"
          onClick={handleAdd}
          disabled={
            !formValues.itemName.trim() ||
            !Number.isFinite(Number(formValues.unitPrice)) ||
            Number(formValues.unitPrice) < 0
          }
          style={{
            backgroundColor: 'var(--ochre-600)',
            borderColor: 'var(--ochre-600)',
          }}
        >
          Add line to sale
        </Button>
      </Form>

      {showSaleCheckoutHint ? (
        <p className="mt-4 text-[11px] leading-snug text-[var(--text-muted)] sm:text-xs">
          Open the sale panel, choose payment mode, then Generate bill to print. Raw sales are not
          written to orders or stock.
        </p>
      ) : null}
    </div>
  );
}

export const BillingPosRawSection = memo(BillingPosRawSectionInner);
