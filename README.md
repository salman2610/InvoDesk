# InvoDesk — Cross-Platform Billing & Business Operations Platform

InvoDesk is a unified billing, point-of-sale (POS), inventory, and business management platform designed for retail counters, B2B wholesale traders, and multi-branch enterprises.

Built with an **offline-first monorepo architecture**, InvoDesk isolates all core business rules, Indian GST calculations, stock movements, and synchronization primitives into shared packages that can power Web, Desktop, and Mobile clients identically.

---

## 🏛️ Architecture Overview

```
InvoDesk/
├── apps/
│   ├── web/                    # Next.js 14 App Router UI (Dual-Mode Counter POS + Business Management Portal)
│   ├── server/                 # Fastify High-Performance REST API (Port 4000)
│   ├── desktop/                # (Planned Phase 3) Desktop client
│   └── mobile/                 # (Planned Phase 3) Mobile client
│
├── packages/
│   ├── types/                  # Shared TypeScript models (Invoices, Customers, Stock, GSTIN, Sync)
│   ├── gst/                    # Indian GST calculation engine (CGST/SGST/IGST, HSN rules, UPI NPCI QR)
│   ├── billing/                # Invoice generation, numbering sequences, payments, WhatsApp share links
│   ├── inventory/              # Real-time stock decrement, low-stock thresholds, inventory valuations
│   └── sync/                   # Offline synchronization engine, idempotent transaction IDs, conflict resolution
```

---

## 🚀 Key Features Implemented in Phase 1 MVP

### 1. Dual-Mode Interface
- **⚡ High-Speed Counter POS**:
  - Barcode lookup & simulation trigger
  - Category pill navigation
  - Cart ledger with live item calculation
  - Keyboard shortcuts (`[F2]` Clear/New, `[F9]` Checkout)
  - Instant Indian GST breakdown (Intra-state CGST+SGST vs Inter-state IGST automatic toggling)
  - Multi-mode settlement:
    - **Cash** (with real-time Cash Tendered & Change Return calculator)
    - **UPI** (Dynamic NPCI QR code generated via canvas for GPay/PhonePe/Paytm/BHIM)
    - **Card** & **Khata Ledger** (Customer credit booking)
- **📊 Executive Business Dashboard**:
  - Real-time today's sales and bill count
  - Monthly revenue with growth trends
  - Customer khata receivables and supplier payables
  - Inventory cost valuation & low-stock warning chips
  - Top 5 selling products matrix
  - Live transactions activity stream

### 2. GST Compliance & Document Formats
- **A4 Standard Indian Tax Invoice**: Fully compliant with Section 31 of CGST Act, 2017 (Seller/Buyer GSTIN, HSN codes, Tax slabs, Reverse charge, Bank details for NEFT/RTGS, Authorized signatory).
- **80mm Thermal Receipt**: Compact thermal register slip for POS receipt printers.
- **WhatsApp Direct Sharing**: 1-click sharing of invoice summaries and links to customer WhatsApp numbers.
- **Form GSTR-1 Assistant**: Automated summary tables for Table 4 (B2B), Table 7 (B2CS), Table 5 (B2CL), and Table 12 (HSN-wise breakdown) with 1-click JSON export.

### 3. Inventory & Customer Management
- Stock movement tracking (`SALE`, `PURCHASE`, `DAMAGE`, `RETURN`, `AUDIT_CORRECTION`)
- Low-stock visual thresholds and reorder indicators
- Customer ledger with credit limits, GSTIN validation, and Khata payment collection

### 4. Offline Synchronization & Idempotency
- Offline mode toggle simulation
- Outbox mutation queue with unique client transaction IDs (`tx_{deviceId}_{ts}_{rand}`)
- Server-side idempotent batch reconciliation (`POST /api/sync/push`)
- Append-only immutable financial records ensuring zero double-billing or dropped transactions

---

## 💻 Running the Platform Locally

### 1. Install & Build
```bash
# In repository root
npm install
npm run build
```

### 2. Start Services
```bash
# Start Fastify API Backend (Port 4000)
npm run start --workspace=@invodesk/server

# Start Next.js Web Application (Port 3000)
npm run dev --workspace=@invodesk/web
```

### 3. Access URLs
- **Web App / POS**: [http://localhost:3000](http://localhost:3000)
- **Fastify API Server**: [http://localhost:4000](http://localhost:4000)
- **Health Check**: [http://localhost:4000/api/health](http://localhost:4000/api/health)
