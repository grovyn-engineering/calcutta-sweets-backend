'use client';

import { App, Button, Form, Input, Modal } from 'antd';
import { UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import styles from './styles.module.css';

export type CustomerFormValues = {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
};

export type CustomerDetailsProps = {
  open: boolean;
  onCancel: () => void;
  onSave?: (values: CustomerFormValues) => void;
  initialValues?: Partial<CustomerFormValues> | null;
};

const phoneRules = [
  { required: true, message: 'Enter a mobile number' },
  {
    pattern: /^[6-9]\d{9}$/,
    message: 'Enter a valid 10-digit Indian mobile number',
  },
];

/** Mounted only while the modal is open so `useForm` is always tied to a mounted `Form`. */
function CustomerDetailsForm({
  initialValues,
  onSave,
  onCancel,
}: {
  initialValues?: Partial<CustomerFormValues> | null;
  onSave?: (values: CustomerFormValues) => void;
  onCancel: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<CustomerFormValues>();

  useEffect(() => {
    form.setFieldsValue({
      name: initialValues?.name ?? '',
      phone: initialValues?.phone ?? '',
      email: initialValues?.email ?? '',
      address: initialValues?.address ?? '',
      notes: initialValues?.notes ?? '',
    });
  }, [form, initialValues]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave?.(values);
      message.success('Customer details saved for this sale');
      onCancel();
    } catch {
      /* validation errors only */
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
              maxLength={120}
            />
          </Form.Item>
          <Form.Item
            label={<span className={styles.fieldLabel}>Mobile</span>}
            name="phone"
            rules={phoneRules}
            className={styles.formItemPhone}
          >
            <Input
              type="tel"
              placeholder="10-digit number"
              className={styles.input}
              maxLength={10}
              inputMode="numeric"
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
        <Button type="primary" onClick={() => void handleSave()}>
          Save to sale
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
}: CustomerDetailsProps) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={520}
      centered
      destroyOnHidden
      footer={null}
      classNames={{
        body: styles.modalBodyRoot,
      }}
      styles={{
        header: {
          borderBottom: '1px solid var(--pearl-bush)',
          marginBottom: 0,
          paddingBottom: 16,
        },
      }}
      title={
        <div className={styles.titleRow}>
          <div className={styles.titleIcon} aria-hidden>
            <UserPlus size={22} strokeWidth={1.75} />
          </div>
          <div>
            <span className={styles.title}>Customer for this sale</span>
            <p className={styles.titleHint}>
              Add contact details for SMS, receipts, or follow-up.
            </p>
          </div>
        </div>
      }
    >
      <CustomerDetailsForm
        initialValues={initialValues}
        onSave={onSave}
        onCancel={onCancel}
      />
    </Modal>
  );
}
