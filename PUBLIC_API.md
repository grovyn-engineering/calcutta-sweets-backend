# Calcutta Sweets - Public API Documentation

This document describes the public API endpoints available for building a customer-facing website. These endpoints are unauthenticated but are scoped to specific shops using a `shopCode`.

## Base URL
The public API is served under the `/public` prefix.
Example: `https://api.yourdomain.com/public`

---

## 1. Get Shop Menu
Retrieve all categories, products, and variants for a specific shop that are marked for website display.

### Endpoint
`GET /public/menu/:shopCode`

### Response Structure
- **shop**: Basic information about the shop (name, UPI ID, booking settings).
- **categories**: An array of categories, each containing its listed **products**.
- **products**: Each product contains its available **variants** and **images**.

### Example Response Snippet
```json
{
  "shop": {
    "shopCode": "MAIN01",
    "name": "Calcutta Sweets - Main Branch",
    "upiId": "merchant@upiprovider"
  },
  "categories": [
    {
      "name": "Sweets",
      "products": [
        {
          "name": "Rasgulla",
          "variants": [{ "id": "...", "name": "1kg", "price": 300 }]
        }
      ]
    }
  ]
}
```

---

## 2. Create Website Order
Submit a new order directly from the website. These orders are marked with `OrderSource: WEBSITE`.

### Endpoint
`POST /public/order`

### Request Body
```json
{
  "shopCode": "MAIN01",
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "customerEmail": "john@example.com",
  "pickupTime": "2024-04-15T10:00:00Z",
  "items": [
    {
      "productId": "...",
      "variantId": "...",
      "quantity": 2
    }
  ]
}
```

---

## Important Integration Notes

1. **Website Visibility**: Only products with `isListedOnWebsite: true` and `isActive: true` will appear in the `getMenu` results.
2. **Shop Rules**:
   - `allowBookingWhenOutOfStock`: If `false`, the API will block order creation if the requested quantity exceeds current inventory.
   - `allowNextDayBooking`: Indicates whether the shop accepts pre-orders via the website.
3. **Draft Status**: All website orders are created in `DRAFT` status and must be confirmed/processed by the shop staff in the Dashboard.
