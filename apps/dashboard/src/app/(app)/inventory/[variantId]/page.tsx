"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Collapse,
  Form,
  Input,
  InputNumber,
  Select,
} from "antd";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch } from "@/lib/api";
import styles from "./page.module.css";

const UNIT_OPTIONS = [
  { value: "KG", label: "KG" },
  { value: "GM", label: "GM" },
  { value: "LTR", label: "LTR" },
  { value: "ML", label: "ML" },
  { value: "PC", label: "PC" },
];

type VariantDetail = {
  id: string;
  name: string;
  barcode: string;
  sku: string | null;
  quantity: number;
  minStock: number | null;
  price: number;
  costPrice: number | null;
  unit: string | null;
  hsnCode: string | null;
  product: {
    id: string;
    name: string;
    description: string | null;
    shopCode: string;
    isActive: boolean;
    category: { id: string; name: string } | null;
    shop: { name: string; shopCode: string };
  };
};

export default function InventoryVariantDetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const variantId = params.variantId as string;
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<VariantDetail | null>(null);

  const { effectiveShopCode } = useShop();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/inventory/variants/${variantId}`, {
        method: "GET",
      });
      if (!res.ok) {
        if (res.status === 404) {
          message.error("Variant not found");
          router.push("/inventory");
          return;
        }
        throw new Error(res.statusText);
      }
      const data = (await res.json()) as VariantDetail;
      setDetail(data);
      form.setFieldsValue({
        productName: data.product.name,
        description: data.product.description ?? "",
        category: data.product.category?.name ?? "—",
        shopName: data.product.shop.name,
        shopCode: data.product.shopCode,
        variantName: data.name,
        barcode: data.barcode,
        sku: data.sku ?? "",
        hsnCode: data.hsnCode ?? "",
        quantity: data.quantity,
        minStock: data.minStock ?? undefined,
        unit: data.unit ?? "PC",
        price: data.price,
        costPrice: data.costPrice ?? undefined,
      });
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [variantId, form, router, message]);

  useEffect(() => {
    load();
  }, [load]);

  const onFinish = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await apiFetch(`/inventory/variants/${variantId}`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity: values.quantity,
          minStock: values.minStock ?? null,
          price: values.price,
          costPrice: values.costPrice ?? null,
          sku: values.sku === "" ? null : values.sku,
          unit: values.unit,
          hsnCode: values.hsnCode === "" ? null : values.hsnCode,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
      const updated = (await res.json()) as VariantDetail;
      setDetail(updated);
      message.success("Saved");
    } catch (e) {
      message.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const productLabel = detail?.product.name ?? "Product";

  return (
    <div className={styles.page}>
      <Breadcrumb
        className={styles.breadcrumb}
        items={[
          {
            title: (
              <Link href="/dashboard" className={styles.crumbLink}>
                Home
              </Link>
            ),
          },
          {
            title: (
              <Link href="/inventory" className={styles.crumbLink}>
                Inventory
              </Link>
            ),
          },
          {
            title: (
              <span className={styles.crumbCurrent}>
                {detail ? productLabel : "…"}
              </span>
            ),
          },
        ]}
      />

      <Card className={styles.card} variant="borderless">
        <Form
          form={form}
          layout="vertical"
          className={styles.form}
          onFinish={onFinish}
          requiredMark={false}
        >
          {loading && !detail ? (
            <div className={styles.formLoading}>
              <LoadingDots />
            </div>
          ) : (
            <>
              <h1 className={styles.title}>{productLabel}</h1>
              <p className={styles.subtitle}>
                Variant: <strong>{detail?.name}</strong>
                {detail?.product.category?.name ? (
                  <>
                    {" "}
                    · {detail.product.category.name}
                  </>
                ) : null}
              </p>

              <Collapse
                bordered={false}
                className={styles.collapse}
                defaultActiveKey={["general", "stock", "pricing"]}
                items={[
              {
                key: "general",
                label: "General information",
                children: (
                  <div className={styles.grid}>
                    <Form.Item name="productName" label="Product name">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item name="shopName" label="Shop">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item name="shopCode" label="Shop code">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item name="category" label="Category">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item
                      name="description"
                      label="Description"
                      className={styles.span2}
                    >
                      <Input.TextArea rows={2} disabled />
                    </Form.Item>
                    <Form.Item name="variantName" label="Variant name">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item name="barcode" label="Barcode">
                      <Input disabled />
                    </Form.Item>
                    <Form.Item name="sku" label="SKU">
                      <Input placeholder="Optional" />
                    </Form.Item>
                    <Form.Item name="hsnCode" label="HSN code">
                      <Input placeholder="Optional" />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: "stock",
                label: "Stock",
                children: (
                  <div className={styles.grid}>
                    <Form.Item
                      name="quantity"
                      label="Quantity on hand"
                      rules={[{ required: true, type: "number", min: 0 }]}
                    >
                      <InputNumber className={styles.fullWidth} min={0} />
                    </Form.Item>
                    <Form.Item name="minStock" label="Minimum stock alert">
                      <InputNumber className={styles.fullWidth} min={0} />
                    </Form.Item>
                    <Form.Item
                      name="unit"
                      label="Unit"
                      rules={[{ required: true, message: "Select unit" }]}
                    >
                      <Select options={UNIT_OPTIONS} className={styles.fullWidth} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: "pricing",
                label: "Pricing",
                children: (
                  <div className={styles.grid}>
                    <Form.Item
                      name="price"
                      label="Selling price (INR)"
                      rules={[{ required: true, type: "number", min: 0 }]}
                    >
                      <InputNumber
                        className={styles.fullWidth}
                        min={0}
                        step={1}
                        prefix="₹"
                      />
                    </Form.Item>
                    <Form.Item name="costPrice" label="Cost price (INR)">
                      <InputNumber
                        className={styles.fullWidth}
                        min={0}
                        step={1}
                      />
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          />

              <div className={styles.actions}>
                <Button onClick={() => router.push("/inventory")}>Back</Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
}
