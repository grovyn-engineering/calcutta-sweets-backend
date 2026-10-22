'use client';

import { useEffect, useRef, useState } from 'react';
import { Input, App, type InputRef } from 'antd';
import { ScanBarcode } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { BillingVariantRow } from '@/hooks/useBillingPosVariants';

interface BarcodeScannerInputProps {
  onAddProduct: (row: BillingVariantRow) => void;
  disabled?: boolean;
}

export function BarcodeScannerInput({
  onAddProduct,
  disabled = false,
}: BarcodeScannerInputProps) {
  const { message } = App.useApp();
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const shouldOwn = () =>
    !disabled &&
    !busy &&
    inputRef.current?.input != null &&
    (document.activeElement === document.body ||
      document.activeElement === null ||
      document.activeElement === inputRef.current.input);

  const tryFocus = () => {
    if (shouldOwn()) inputRef.current?.focus();
  };

  useEffect(() => {
    const raf = requestAnimationFrame(tryFocus);
    const onFocusOut = () => {
      requestAnimationFrame(tryFocus);
    };

    document.addEventListener('focusout', onFocusOut);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, [disabled, busy]);

  const handleScan = async (barcode: string) => {
    const trimmed = barcode.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    try {
      const res = await apiFetch(
        `/inventory/variants/lookup?barcode=${encodeURIComponent(trimmed)}`,
      );

      if (res.status === 404) {
        message.warning(`No product found for barcode: ${trimmed}`);
        return;
      }

      if (!res.ok) {
        message.error('Barcode lookup failed.');
        return;
      }

      const v: {
        id: string;
        productId: string;
        productName: string;
        variantName: string;
        barcode: string;
        price: number;
        unit?: string;
        stock: number;
        category?: string | null;
        imageUrl?: string | null;
        images?: { id: string; url: string }[];
      } = await res.json();

      onAddProduct({
        variantId: v.id,
        productId: v.productId,
        productName: v.productName,
        variantName: v.variantName,
        barcode: v.barcode,
        price: v.price,
        unit: v.unit ?? 'PC',
        stock: v.stock,
        category: v.category ?? null,
        imageUrl: v.imageUrl ?? null,
        images: v.images ?? [],
      });
    } catch (err) {
      console.error('Barcode lookup error:', err);
      message.error('Failed to look up barcode.');
    } finally {
      // Clear on every outcome: a scanner types the next code straight after the last one,
      // so a leftover unknown code would be glued onto it. The toast still names the code.
      setValue('');
      setBusy(false);
      requestAnimationFrame(tryFocus);
    }
  };

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onPressEnter={() => void handleScan(value)}
      placeholder="Scan or type a barcode"
      size="large"
      prefix={
        <ScanBarcode
          className="mr-1 h-[18px] w-[18px] text-[var(--ochre-500)]"
          strokeWidth={1.8}
          aria-hidden
        />
      }
      suffix={
        <kbd className="hidden rounded border border-[var(--border)] bg-[var(--surface-subtle)] px-1.5 py-px font-sans text-[11px] text-[var(--text-muted)] sm:inline">
          Enter ↵
        </kbd>
      }
      disabled={disabled || busy}
      allowClear
      autoFocus
      autoComplete="off"
      spellCheck={false}
      style={{
        height: 48,
        borderRadius: 10,
        background: 'var(--surface)',
        borderColor: 'var(--border-strong)',
        boxShadow: busy ? 'var(--ring)' : 'none',
      }}
    />
  );
}