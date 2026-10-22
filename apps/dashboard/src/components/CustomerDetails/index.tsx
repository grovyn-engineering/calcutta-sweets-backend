'use client';

import { App, Button, Drawer, Form, Input } from 'antd';
import { UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './styles.module.css';
import {
  indianMobileRequiredRules,
  normalizeMobileFormValue,
} from '@/lib/mobileNumber';
import { apiFetch } from '@/lib/api';
import { CUSTOMER_NAME_MAX_LENGTH } from '@/lib/customerFields';
import { gstinOptionalRules, normalizeGstinFormValue } from '@/lib/gstin';

export type CustomerFormValues = {
  /** Set when the customer was picked from (or saved to) the shop's customer list. */
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  /** Customer GSTIN for invoices when provided */
  gstin?: string;
};

export type CustomerDetailsProps = {
  open: boolean;
  onCancel: () => void;
  onSave?: (values: CustomerFormValues) => void;
  initialValues?: Partial<CustomerFormValues> | null;
  /** When set, edits the saved customer (PATCH /customers/:id) instead of only this sale. */
  customerId?: string | null;
  /** Saved customers only: whether the phone (shop-unique key) may be changed. */
  canEditPhone?: boolean;
};

/** Customer row from the API (null optionals) -> form values. */
export function customerFromApi(row: {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  gstin?: string | null;
}): CustomerFormValues {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    gstin: row.gstin ?? undefined,
  };
}

/** Mounted only while the modal is open so `useForm` is always tied to a mounted `Form`. */
function CustomerDetailsForm({
  initialValues,
  onSave,
  onCancel,
  customerId,
  canEditPhone,
}: {
  initialValues?: Partial<CustomerFormValues> | null;
  onSave?: (values: CustomerFormValues) => void;
  onCancel: () => void;
  customerId?: string | null;
  canEditPhone: boolean;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();
  const phone = Form.useWatch('phone', form);
  const lastFetchedPhoneRef = useRef<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isSaved = Boolean(customerId);

  useEffect(() => {
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      phone: initialValues?.phone ?? '',
      email: initialValues?.email ?? '',
      address: initialValues?.address ?? '',
      notes: initialValues?.notes ?? '',
      gstin: initialValues?.gstin ?? '',
    });
  }, [form, initialValues]);

  useEffect(() => {
    // Saved customer: the form already holds its record; a phone change must not pull in another one.
    if (isSaved) return;
    const mobile = normalizeMobileFormValue(phone);
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      lastFetchedPhoneRef.current = null;
      return;
    }
    if (lastFetchedPhoneRef.current === mobile) return;
    lastFetchedPhoneRef.current = mobile;

    let ignore = false;
    void (async () => {
      try {
        const res = await apiFetch(
          `/orders/customer/by-phone?phone=${encodeURIComponent(mobile)}`,
        );
        if (!res.ok || ignore) return;
        const existing = (await res.json()) as Partial<CustomerFormValues> | null;
        if (!existing || ignore) return;
        form.setFieldsValue({
          name: existing.name ?? '',
          phone: existing.phone ?? mobile,
          email: existing.email ?? '',
          address: existing.address ?? '',
          notes: existing.notes ?? '',
          gstin: existing.gstin ?? '',
        });
        message.success('Loaded existing customer details');
      } catch {
        /* non-blocking prefill */
      }
    })();

    return () => {
      ignore = true;
    };
  }, [form, message, phone, isSaved]);

  const handleSave = async () => {
    let values: CustomerFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return; /* validation errors only */
    }
    if (!customerId) {
      onSave?.(values);
      message.success('Customer details saved for this sale');
      onCancel();
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch(`/customers/${encodeURIComponent(customerId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: values.name,
          ...(canEditPhone ? { phone: values.phone } : {}),
          email: values.email ?? '',
          address: values.address ?? '',
          notes: values.notes ?? '',
          gstin: values.gstin ?? '',
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof payload?.message === 'string'
            ? payload.message
            : 'Could not update the customer. Please try again.';
        message.error(msg);
        return;
      }
      onSave?.(customerFromApi(payload));
      message.success('Customer updated');
      onCancel();
    } catch {
      message.error('Network error while updating the customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        className={styles.form}
        autoComplete="off"
      >
        <div className={styles.sectionLabel}>Required</div>
        <div className={styles.rowTwo}>
          <Form.Item
            label={<span className={styles.fieldLabel}>Full name</span>}
            name="name"
            rules={[{ required: true, message: 'Enter customer name' }]}
            className={styles.formItemGrow}
          >
            <Input
              placeholder="e.g. Amit Kumar"
              className={styles.input}
              maxLength={CUSTOMER_NAME_MAX_LENGTH}
              showCount
            />
          </Form.Item>
          <Form.Item
            label={<span className={styles.fieldLabel}>Mobile</span>}
            name="phone"
            rules={indianMobileRequiredRules}
            normalize={normalizeMobileFormValue}
            className={styles.formItemPhone}
            tooltip={
              isSaved && !canEditPhone
                ? 'Only a manager or admin can change a saved customer’s mobile'
                : undefined
            }
          >
            <Input
              disabled={isSaved && !canEditPhone}
              type="tel"
              placeholder="10 digits (6–9…)"
              className={styles.input}
              maxLength={10}
              inputMode="numeric"
              autoComplete="tel"
            />
          </Form.Item>
        </div>

        <div className={styles.sectionLabel}>Optional</div>
        <Form.Item
          label={<span className={styles.fieldLabel}>Email</span>}
          name="email"
          rules={[{ type: 'email', message: 'Enter a valid email' }]}
        >
          <Input
            type="email"
            placeholder="For e-receipt (optional)"
            className={styles.input}
          />
        </Form.Item>
        <Form.Item
          label={<span className={styles.fieldLabel}>GSTIN (optional)</span>}
          name="gstin"
          normalize={normalizeGstinFormValue}
          rules={gstinOptionalRules}
        >
          <Input
            placeholder="15-character GSTIN"
            className={`${styles.input} font-mono`}
            maxLength={15}
          />
        </Form.Item>
        <Form.Item
          label={<span className={styles.fieldLabel}>Delivery / billing address</span>}
          name="address"
        >
          <Input.TextArea
            placeholder="Flat, street, area, PIN…"
            className={styles.textarea}
            rows={2}
            maxLength={500}
            showCount
          />
        </Form.Item>
        <Form.Item
          label={<span className={styles.fieldLabel}>Notes</span>}
          name="notes"
        >
          <Input.TextArea
            placeholder="Allergies, occasion, special instructions…"
            className={styles.textarea}
            rows={2}
            maxLength={280}
            showCount
          />
        </Form.Item>
      </Form>
      <div className={`${styles.modalFooter} ${styles.footer}`}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" loading={saving} onClick={() => void handleSave()}>
          {isSaved ? 'Save customer' : 'Save to sale'}
        </Button>
      </div>
    </>
  );
}

export default function CustomerDetails({
  open,
  onCancel,
  onSave,
  initialValues,
  customerId,
  canEditPhone = false,
}: CustomerDetailsProps) {
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      placement="right"
      size={480}
      destroyOnHidden
      classNames={{
        body: styles.modalBodyRoot,
      }}
      styles={{
        header: {
          borderBottom: '1px solid var(--pearl-bush)',
        },
      }}
      title={
        <div className={styles.titleRow}>
          <div className={styles.titleIcon} aria-hidden>
            <UserPlus size={22} strokeWidth={1.75} />
          </div>
          <div>
            <span className={styles.title}>
              {customerId ? 'Edit saved customer' : 'Customer for this sale'}
            </span>
            <p className={styles.titleHint}>
              {customerId
                ? 'Changes are saved to the customer record and used on this bill.'
                : 'Add contact details for SMS, receipts, or follow-up.'}
            </p>
          </div>
        </div>
      }
    >
      <CustomerDetailsForm
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
        customerId={customerId}
        canEditPhone={canEditPhone}
      />
    </Drawer>
  );
}
