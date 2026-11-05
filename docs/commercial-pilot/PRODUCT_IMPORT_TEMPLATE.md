# InvoDesk Product Import Specification & Template

InvoDesk supports batch product importing via JSON (`POST /api/products/import`) or CSV import tools.

---

## 1. Import Field Reference

| Column / Field | Type | Required | Description & Validation |
| :--- | :--- | :--- | :--- |
| `sku` | String | **Yes** | Unique Stock Keeping Unit (e.g. `ELEC-SAMS-T7`, `GROC-ATTA-10KG`) |
| `name` | String | **Yes** | Product display name printed on bills and receipts |
| `sellingPrice` | Number | **Yes** | Selling price excluding tax (e.g. `840.00`) |
| `gstRate` | Number | No | Applicable GST slab: `0`, `5`, `12`, `18`, or `28` (default: `18`) |
| `cessRate` | Number | No | Additional compensation cess percentage if applicable (default: `0`) |
| `hsnCode` | String | No | 4 to 8 digit HSN/SAC code (e.g. `84716060`, `09024020`, default `9983`) |
| `unit` | String | No | Unit of measure: `PCS`, `BOX`, `KG`, `LTR`, `PACK` (default: `PCS`) |
| `currentStock` | Integer | No | Opening stock level (default: `0`) |
| `minStockAlert`| Integer | No | Low stock warning threshold (default: `5`) |
| `purchasePrice`| Number | No | Cost purchase price excluding tax for valuation |
| `mrp` | Number | No | Maximum Retail Price inclusive of taxes |
| `category` | String | No | Category grouping for POS tabs (e.g. `Computer Accessories`) |
| `barcode` | String | No | EAN-13, UPC, or Code-128 numeric barcode string |

---

## 2. JSON Import Payload Template

```json
{
  "products": [
    {
      "sku": "ELEC-LOG-M220",
      "name": "Logitech M220 Silent Wireless Mouse",
      "sellingPrice": 840,
      "gstRate": 18,
      "hsnCode": "84716060",
      "unit": "PCS",
      "currentStock": 48,
      "minStockAlert": 10,
      "purchasePrice": 650,
      "mrp": 995,
      "category": "Computer Accessories",
      "barcode": "8901030456123"
    },
    {
      "sku": "FMCG-TATA-TEA",
      "name": "Tata Tea Gold Premium Blend 500g",
      "sellingPrice": 285,
      "gstRate": 5,
      "hsnCode": "09024020",
      "unit": "PACK",
      "currentStock": 120,
      "minStockAlert": 25,
      "purchasePrice": 240,
      "mrp": 310,
      "category": "Groceries & Beverages",
      "barcode": "8901052002345"
    }
  ]
}
```

