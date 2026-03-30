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
};
