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
import { ContentSkeleton } from "@/components/ContentSkeleton/ContentSkeleton";
import { BarcodePrintModal } from "@/components/BarcodePrintModal/BarcodePrintModal";
import { apiFetch } from "@/lib/api";
import { uploadImageToCloudinary } from "@/lib/cloudinaryUpload";
import styles from "./page.module.css";
import {
  Globe,
  Link as LinkIcon,
  Plus,
  Printer,
  Trash2,
  Upload as UploadIcon,
} from "lucide-react";

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

type VariantFormValues = {
  productName: string;
  description: string;
  categoryId?: string;
  shopName: string;
  shopCode: string;
  variantName: string;
  barcode: string;
  sku: string;
  hsnCode: string;
  quantity: number;
  minStock?: number;
  unit: string;
  price: number;
  costPrice?: number;
  isListedOnWebsite: boolean;
  imageUrls: string[];
  pendingImageUrl: string;
};

function ImageUrlsFormAnchor({
  value: _v,
  onChange: _on,
}: {
  value?: string[];
  onChange?: (v: string[]) => void;
}) {
  return (
    <span
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        clip: "rect(0,0,0,0)",
      }}
      aria-hidden
    />
  );
}

type InventoryVariantEditorProps = {
  detail: VariantDetail;
  variantId: string;
  onSaved: (d: VariantDetail) => void;
  onOpenPrint: () => void;
};

function InventoryVariantEditor({
  detail,
  variantId,
  onSaved,
  onOpenPrint,
}: InventoryVariantEditorProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const [form] = Form.useForm<VariantFormValues>();
  const [saving, setSaving] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string }[]
  >([]);

  const imageUrls = Form.useWatch("imageUrls", form) ?? [];

  useEffect(() => {
    void apiFetch("/category")
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setCategoryOptions(
            data.map((c: { id: string; name: string }) => ({
              label: c.name,
              value: c.id,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const urls = (detail.product.images || []).map((img) => img.url);
    form.setFieldsValue({
      productName: detail.product.name,
      description: detail.product.description ?? "",
      categoryId: detail.product.category?.id,
      shopName: detail.product.shop.name,
      shopCode: detail.product.shopCode,
      variantName: detail.name,
      barcode: detail.barcode,
      sku: detail.sku ?? "",
      hsnCode: detail.hsnCode ?? "",
      quantity: detail.quantity,
      minStock: detail.minStock ?? undefined,
      unit: detail.unit ?? "PC",
      price: detail.price,
      costPrice: detail.costPrice ?? undefined,
      isListedOnWebsite: detail.product.isListedOnWebsite,
      imageUrls: urls,
      pendingImageUrl: "",
    });
  }, [detail, form]);

  const addImageByUrl = () => {
    const pending = (form.getFieldValue("pendingImageUrl") ?? "").trim();
    if (!pending) return;
    const current = (form.getFieldValue("imageUrls") ?? []) as string[];
    if (current.includes(pending)) {
      message.warning("This image is already added");
      return;
    }
    form.setFieldsValue({
      imageUrls: [...current, pending],
      pendingImageUrl: "",
    });
  };

  const removeImage = (url: string) => {
    const current = (form.getFieldValue("imageUrls") ?? []) as string[];
    form.setFieldValue(
      "imageUrls",
      current.filter((u) => u !== url),
    );
  };

  const handleUpload = async (file: File) => {
    try {
      const url = await uploadImageToCloudinary(file);
      const current = (form.getFieldValue("imageUrls") ?? []) as string[];
      form.setFieldValue("imageUrls", [...current, url]);
      message.success("Image uploaded");
      return false;
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Upload failed");
      return false;
    }
  };

  const onFinish = async (values: VariantFormValues) => {
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
          images: values.imageUrls ?? [],
          name: values.variantName.trim(),
          productName: values.productName.trim(),
          categoryId:
            values.categoryId === undefined || values.categoryId === ""
              ? null
              : values.categoryId,
          barcode: values.barcode.trim(),
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof errBody?.message === "string"
            ? errBody.message
            : Array.isArray(errBody?.message)
              ? errBody.message.join(", ")
              : res.statusText;
        throw new Error(msg);
      }
      const updated = (await res.json()) as VariantDetail;
      onSaved(updated);
      message.success("Saved");
    } catch (e) {
      message.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const productLabel = detail.product.name;

  return (
    <Card className={styles.card} variant="borderless">
      <Form<VariantFormValues>
        form={form}
        layout="vertical"
        className={styles.form}
        onFinish={onFinish}
        requiredMark={false}
      >
        <Form.Item name="imageUrls" noStyle initialValue={[]}>
          <ImageUrlsFormAnchor />
        </Form.Item>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={styles.title}>{productLabel}</h1>
            <p className={styles.subtitle}>
              Variant: <strong>{detail.name}</strong>
              {detail.product.category?.name ? (
                <>
                  {" "}
                  · {detail.product.category.name}
                </>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-[var(--linen-100)] border border-[var(--bistre-100)]">
            <Globe className="w-4 h-4 text-[var(--bistre-400)]" />
            <span className="text-xs font-medium text-[var(--bistre-600)] mr-1">
              Public on website
            </span>
            <Form.Item
              name="isListedOnWebsite"
              valuePropName="checked"
              noStyle
            >
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
                      <div key={`${url}-${index}`} className={styles.imageContainer}>
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className={styles.previewImage}
                        />
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
                    <Form.Item name="pendingImageUrl" noStyle>
                      <Input
                        placeholder="Or paste an image URL here..."
                        onPressEnter={(e) => {
                          e.preventDefault();
                          addImageByUrl();
                        }}
                        prefix={
                          <LinkIcon className="w-4 h-4 text-[var(--bistre-400)]" />
                        }
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
                    </Form.Item>
                  </div>
                </div>
              ),
            },
            {
              key: "general",
              label: "General information",
              children: (
                <div className={styles.grid}>
                  <Form.Item
                    name="productName"
                    label="Product name"
                    rules={[{ required: true, message: "Required" }]}
                    extra="Shared by every variant of this product."
                  >
                    <Input autoComplete="off" />
                  </Form.Item>
                  <Form.Item name="shopName" label="Shop">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item name="shopCode" label="Shop code">
                    <Input disabled />
                  </Form.Item>
                  <Form.Item
                    name="categoryId"
                    label="Category"
                    extra="Shared by every variant of this product."
                  >
                    <Select
                      placeholder="Uncategorized"
                      options={categoryOptions}
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      className={styles.fullWidth}
                    />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label="Description"
                    className={styles.span2}
                    help="Visible to customers on the website menu"
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Add a tempting description for your customers..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="variantName"
                    label="Variant name"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input
                      placeholder="e.g. Regular, 500g"
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Form.Item
                    name="barcode"
                    label="Barcode"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input autoComplete="off" />
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
                    <Select
                      options={UNIT_OPTIONS}
                      className={styles.fullWidth}
                    />
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
                      prefix={"\u20B9"}
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
          {detail.barcode ? (
            <Button
              icon={<Printer className="w-4 h-4" />}
              onClick={onOpenPrint}
            >
              Print Label
            </Button>
          ) : null}
          <Button onClick={() => router.push("/inventory")}>Back</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default function InventoryVariantDetailPage() {
  const { message } = App.useApp();
  const params = useParams();
  const router = useRouter();
  const variantId = params.variantId as string;
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<VariantDetail | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

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
    } catch (e) {
      message.error(String(e));
    } finally {
      setLoading(false);
    }
  }, [variantId, router, message]);

  useEffect(() => {
    void load();
  }, [load]);

  const productLabel = detail?.product.name ?? "Product";

  return (
    <div className={styles.page}>
      {loading && !detail ? (
        <ContentSkeleton variant="detail" rowCount={10} />
      ) : (
        <>
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

          {detail ? (
            <InventoryVariantEditor
              key={detail.id}
              detail={detail}
              variantId={variantId}
              onSaved={setDetail}
              onOpenPrint={() => setPrintModalOpen(true)}
            />
          ) : null}

          {detail ? (
            <BarcodePrintModal
              open={printModalOpen}
              onCancel={() => setPrintModalOpen(false)}
              items={[
                {
                  id: detail.id,
                  productName: detail.product.name,
                  variantName: detail.name,
                  barcode: detail.barcode,
                  price: detail.price,
                },
              ]}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
