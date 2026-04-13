"use client";

import { useState, useEffect } from "react";
import { Form, InputNumber, Button, App, Alert } from "antd";
import { PercentageOutlined } from "@ant-design/icons";
import { useShop } from "../../../../contexts/ShopContext";
import { apiFetch } from "../../../../lib/api";

export function TaxSettings() {
    const { message } = App.useApp();
    const { effectiveShopCode, shops } = useShop();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const currentShop = shops.find(s => s.shopCode === effectiveShopCode);

    useEffect(() => {
        if (currentShop) {
            form.setFieldsValue({
                cgstRate: currentShop.cgstRate,
                sgstRate: currentShop.sgstRate,
            });
        }
    }, [currentShop, form]);

    const onFinish = async (values: any) => {
        if (!currentShop) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/shops/${currentShop.id}`, {
                method: "PATCH",
                body: JSON.stringify(values),
            });
            if (!res.ok) throw new Error("Failed to update tax rates");
            
            message.success("Tax rates updated successfully. Please refresh or switch shops to apply changes everywhere.");
            // Note: ShopContext handles most things but a reload ensures everything is perfectly in sync
            setTimeout(() => {
              window.location.reload();
            }, 1000);
        } catch (e: any) {
            message.error(e.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!currentShop) {
      return <div className="p-4 text-center text-gray-400">Please select a shop to manage tax settings.</div>;
    }

    return (
        <div className="mt-4 space-y-6">
            <Alert 
              title="Inclusive Tax Billing Enabled"
              description="Current price of products in the Bill POS will be treated as inclusive of the GST rates defined below. Extra tax will not be added on top of the selling price."
              type="info"
              showIcon
              className="rounded-xl border-[var(--ochre-200)] bg-[var(--ochre-10)]"
            />

            <Form form={form} layout="vertical" onFinish={onFinish}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                    <Form.Item 
                      label="CGST Rate (%)" 
                      name="cgstRate" 
                      rules={[{ required: true, message: 'Please enter CGST rate' }]}
                      extra="Central Goods and Services Tax"
                    >
                        <InputNumber 
                          prefix={<PercentageOutlined />} 
                          placeholder="2.5" 
                          min={0}
                          max={100}
                          step={0.1}
                          size="large" 
                          className="w-full !bg-white" 
                        />
                    </Form.Item>

                    <Form.Item 
                      label="SGST Rate (%)" 
                      name="sgstRate" 
                      rules={[{ required: true, message: 'Please enter SGST rate' }]}
                      extra="State Goods and Services Tax"
                    >
                        <InputNumber 
                          prefix={<PercentageOutlined />} 
                          placeholder="2.5" 
                          min={0}
                          max={100}
                          step={0.1}
                          size="large" 
                          className="w-full !bg-white" 
                        />
                    </Form.Item>
                </div>

                <div className="mt-2 flex flex-col gap-2">
                    <p className="text-sm font-semibold text-[var(--bistre-800)]">
                        Total GST: {((form.getFieldValue('cgstRate') || 0) + (form.getFieldValue('sgstRate') || 0)).toFixed(2)}%
                    </p>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading} 
                      size="large" 
                      className="w-full md:w-auto px-8"
                      style={{ backgroundColor: 'var(--ochre-600)', borderColor: 'var(--ochre-600)' }}
                    >
                        Update Tax Configuration
                    </Button>
                </div>
            </Form>
        </div>
    );
}
