/** Product image as returned by barcode lookup (absolute URLs). */
export type BillingProductImage = { id: string; url: string };

/** Row shape passed to the bill when adding from manual billing (Tabulator or other UIs). */
export type BillingVariantRow = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  barcode: string;
  price: number;
  unit: string;
  stock: number;
  category: string | null;
  /** Primary image URL (API resolves absolute, including for `/uploads/...`). */
  imageUrl?: string | null;
  /** Full ordered gallery, same shape as inventory variant `product.images`. */
  images?: BillingProductImage[];
};
