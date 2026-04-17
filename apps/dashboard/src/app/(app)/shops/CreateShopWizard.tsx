'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Table, InputNumber, message, Steps, Divider, Space } from 'antd';
import { Search } from 'lucide-react';
import { antTableOverflowComponents } from '@/components/AntTableOverflowCell/AntTableOverflowCell';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

interface Variant {
  id: string;
  productName: string;
  variantName: string;
  barcode: string;
  price: number;
  quantity: number;
}

interface CreateShopWizardProps {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function CreateShopWizard({ open, onCancel, onSuccess }: CreateShopWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  // Fetch variants from Factory shop when step 1 is complete
  useEffect(() => {
    if (currentStep === 1 && variants.length === 0) {
      fetchFactoryVariants();
    }
  }, [currentStep]);

  const fetchFactoryVariants = async (q: string = '') => {
    setTableLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const url = new URL(`${baseUrl}/inventory/variants`);
      url.searchParams.set('shopCode', 'FACTORY01'); // Always clone from Factory
      url.searchParams.set('page', '1');
      url.searchParams.set('size', '100');
      if (q) url.searchParams.set('q', q);

      const res = await fetch(url.toString(), {
          headers: getAuthHeaders(),
      });
      const result = await res.json();
      if (res.ok) {
        setVariants(result.data || []);
      }
    } catch (err) {
      message.error('Failed to load products from factory');
    } finally {
      setTableLoading(false);
    }
  };

  const handleNext = async () => {
    try {
      await form.validateFields(['name']);
      setCurrentStep(1);
    } catch (err) {
      // Validation failed
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const formData = form.getFieldsValue();
      const initialInventory = Object.entries(selectedVariants)
        .filter(([_, qty]) => qty > 0)
        .map(([variantId, quantity]) => ({ variantId, quantity }));

      const res = await fetch(`${getApiBaseUrl()}/shops/bulk-create`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          sourceShopCode: 'FACTORY01',
          initialInventory,
        }),
      });

      if (res.ok) {
        message.success('Shop created and stock cloned successfully');
        onSuccess();
        reset();
      } else {
        const err = await res.json();
        message.error(err.message || 'Failed to create shop');
      }
    } catch (err) {
      message.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    form.resetFields();
    setCurrentStep(0);
    setSelectedVariants({});
    setSearchQuery('');
    onCancel();
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Variant',
      dataIndex: 'variantName',
      key: 'variantName',
    },
    {
      title: 'Factory Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (q: number) => <span style={{ fontWeight: 500 }}>{q}</span>
    },
    {
      title: 'Add to New Shop',
      key: 'addQty',
      width: 150,
      render: (_: any, record: Variant) => (
        <InputNumber
          min={0}
          max={record.quantity}
          value={selectedVariants[record.id] || 0}
          onChange={(val) => {
            setSelectedVariants(prev => ({
              ...prev,
              [record.id]: val || 0
            }));
          }}
          placeholder="Qty"
        />
      ),
    },
  ];

  const filteredVariants = variants.filter(v => 
    v.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.variantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      title="Add New Shop"
      open={open}
      onCancel={reset}
      footer={null}
      width={800}
    >
      <Steps
        current={currentStep}
        items={[
          { title: 'Shop Info' },
          { title: 'Initial Inventory' },
        ]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 && (
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Shop Name"
            rules={[{ required: true, message: 'Please enter shop name' }]}
          >
            <Input placeholder="e.g., Calcutta Sweets Salt Lake" size="large" />
          </Form.Item>
          
          <Form.Item
            name="currency"
            label="Currency"
            initialValue="INR"
          >
            <Input disabled />
          </Form.Item>

          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button type="primary" size="large" onClick={handleNext}>
              Next: Select Inventory
            </Button>
          </div>
        </Form>
      )}

      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <p style={{ color: 'var(--bistre-500)', fontSize: '13px', marginBottom: 12 }}>
              Select products from the <b>Factory</b> to stock the new shop. Available stock will be moved to the new shop.
            </p>
            <Input
              placeholder="Search products..."
              prefix={<Search size={16} />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              size="large"
            />
          </div>

          <Table
            dataSource={filteredVariants}
            columns={columns}
            components={antTableOverflowComponents}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            loading={tableLoading}
            size="small"
            bordered
          />

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button onClick={() => setCurrentStep(0)}>Back</Button>
            <Space>
              <span style={{ fontSize: '12px', color: 'var(--bistre-400)' }}>
                {Object.values(selectedVariants).filter(q => q > 0).length} items selected
              </span>
              <Button 
                type="primary" 
                size="large" 
                loading={loading}
                onClick={handleCreate}
              >
                Create Shop & Add Inventory
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
}
