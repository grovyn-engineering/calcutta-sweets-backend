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
  Switch,
  Upload,
} from "antd";
import { LoadingDots } from "@/components/LoadingDots/LoadingDots";
import { BarcodePrintModal } from "@/components/BarcodePrintModal/BarcodePrintModal";
import { useShop } from "@/contexts/ShopContext";
import { apiFetch, getApiBaseUrl } from "@/lib/api";
import styles from "./page.module.css";
import { Globe, Image as ImageIcon, Link as LinkIcon, Plus, Printer, Trash2, Upload as UploadIcon } from "lucide-react";

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
    isListedOnWebsite: boolean;
    shopCode: string;
    isActive: boolean;
    category: { id: string; name: string } | null;
    shop: { name: string; shopCode: string };
    images: { id: string; url: string }[];
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const addImageByUrl = () => {
    if (!newUrl.trim()) return;
    if (imageUrls.includes(newUrl.trim())) {
      message.warning("This image is already added");
      return;
    }
    setImageUrls([...imageUrls, newUrl.trim()]);
    setNewUrl("");
  };

  const removeImage = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/inventory/upload", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, fetch will handle it for FormData
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      const fullUrl = `${getApiBaseUrl().replace("/api", "")}${url}`;
      setImageUrls([...imageUrls, fullUrl]);
      message.success("Image uploaded");
      return false; // Prevent default upload behavior
    } catch (e) {
      message.error("Upload failed");
      return false;
    }
  };

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
        category: data.product.category?.name ?? "-",
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
        isListedOnWebsite: data.product.isListedOnWebsite,
        images: (data.product.images || []).map((img) => img.url),
      });
      setImageUrls((data.product.images || []).map((img) => img.url));
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [variantId, form, router, message]);

  useEffect(() => {
    load();
  }, [load]);

  const onFinish = async (values: Record<string, any>) => {
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
          description: values.description,
          isListedOnWebsite: values.isListedOnWebsite,
          images: imageUrls,
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
              <div className="flex items-center justify-between mb-4">
                <div>
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
                </div>
                <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-[var(--linen-100)] border border-[var(--bistre-100)]">
                  <Globe className="w-4 h-4 text-[var(--bistre-400)]" />
                  <span className="text-xs font-medium text-[var(--bistre-600)] mr-1">Public on website</span>
                  <Form.Item name="isListedOnWebsite" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </div>
              </div>

              <Collapse
                bordered={false}
                className={styles.collapse}
                defaultActiveKey={["general", "images", "stock", "pricing"]}
                items={[
                  {
                    key: "images",
                    label: "Product images",
                    children: (
                      <div className={styles.imageSection}>
                        <div className={styles.imageGallery}>
                          {imageUrls.map((url, index) => (
                            <div key={index} className={styles.imageContainer}>
                              <img src={url} alt={`Product ${index}`} className={styles.previewImage} />
                              <button
                                type="button"
                                className={styles.deleteImageBtn}
                                onClick={() => removeImage(url)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            multiple={false}
                            beforeUpload={handleUpload}
                          >
                            <div className={styles.uploadBox}>
                              <UploadIcon className="w-6 h-6 mb-2" />
                              <span className="text-xs font-bold">Upload</span>
                            </div>
                          </Upload>
                        </div>

                        <div className={styles.urlInputGroup}>
                          <Input
                            placeholder="Or paste an image URL here..."
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            onPressEnter={(e) => {
                              e.preventDefault();
                              addImageByUrl();
                            }}
                            prefix={<LinkIcon className="w-4 h-4 text-[var(--bistre-400)]" />}
                            suffix={
                              <Button
                                type="text"
                                size="small"
                                onClick={addImageByUrl}
                                className="flex items-center justify-center p-1"
                              >
                                <Plus className="w-4 h-4 text-[var(--ochre-600)]" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    ),
                  },
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
                          help="Visible to customers on the website menu"
                        >
                          <Input.TextArea rows={3} placeholder="Add a tempting description for your customers..." />
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
                {detail?.barcode && (
                  <Button
                    icon={<Printer className="w-4 h-4" />}
                    onClick={() => setPrintModalOpen(true)}
                  >
                    Print Label
                  </Button>
                )}
                <Button onClick={() => router.push("/inventory")}>Back</Button>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card>

      {detail && (
        <BarcodePrintModal
          open={printModalOpen}
          onCancel={() => setPrintModalOpen(false)}
          items={[{
            id: detail.id,
            productName: detail.product.name,
            variantName: detail.name,
            barcode: detail.barcode,
            price: detail.price,
          }]}
        />
      )}
    </div>
  );
}
