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

  useEffect(() => {
    const refocus = (e: MouseEvent) => {
      if (disabled || busy) return;

      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('a') ||
        target.closest('.ant-select') ||
        target.closest('.ant-dropdown') ||
        target.closest('.ant-menu') ||
        target.closest('.ant-picker')
      ) {
        return;
      }

      setTimeout(() => inputRef.current?.focus(), 10);
    };

    document.addEventListener('mousedown', refocus);

    const initial = setTimeout(() => {
      if (!disabled && !busy) inputRef.current?.focus();
    }, 100);

    return () => {
      document.removeEventListener('mousedown', refocus);
      clearTimeout(initial);
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

      const v = await res.json();

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
      });

      setValue('');
    } catch (err) {
      console.error('Barcode lookup error:', err);
      message.error('Failed to look up barcode.');
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 50);
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
