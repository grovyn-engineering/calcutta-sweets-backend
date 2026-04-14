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

      setValue('');
    } catch (err) {
      console.error('Barcode lookup error:', err);
      message.error('Failed to look up barcode.');
    } finally {
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
      placeholder="Scan product barcode…"
      size="large"
      prefix={<ScanBarcode className="h-5 w-5 text-[var(--ochre-501)]" />}
      disabled={disabled || busy}
      allowClear
      autoFocus
      autoComplete="off"
      spellCheck={false}
      style={{
        borderRadius: '0.75rem',
        border: '1px solid var(--ochre-200)',
        boxShadow: busy ? '0 0 0 2px var(--ochre-100)' : 'none',
      }}
    />
  );
}