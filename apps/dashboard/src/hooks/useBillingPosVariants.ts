export type BillingProductImage = { id: string; url: string };

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
  imageUrl?: string | null;
  images?: BillingProductImage[];
};
