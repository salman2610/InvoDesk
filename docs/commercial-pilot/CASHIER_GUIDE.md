# InvoDesk Cashier Operational Handbook

This guide outlines standard operating procedures for counter operators and cashier terminals running InvoDesk.

---

## 1. Starting Shift
1. Log in to the terminal with your assigned cashier account.
2. If opening float prompt appears, declare physical cash in the drawer (e.g. `₹2,000`).
3. Ensure the receipt printer status indicator shows **Ready / Paper OK**.

---

## 2. Daily Checkout Operations
- **Adding Items to Cart**:
  - Scan product barcode with the handheld scanner or type SKU / Name in the search box.
  - Items with `0` stock are disabled by default (`Out of Stock`) and cannot be billed.
  - Cart quantities cannot exceed available inventory; the `+` button disables when stock limit is reached.
- **Customer Assignment**:
  - Default: `Counter Retail Cash Customer`.
  - For B2B customers, select the customer profile to verify their GSTIN and automatically compute Intra-State (`CGST + SGST`) or Inter-State (`IGST`) tax calculations.
- **Selecting Payment Method**:
  - **CASH**: Enter cash tendered to calculate exact customer return change. Drawer opens upon settlement.
  - **UPI**: Generates a dynamic NPCI UPI QR code. Cashier checks UPI alert or asks for UTR number before concluding. *Note: QR generation is not payment confirmation.*
  - **CARD**: Swipe/tap on payment terminal, enter transaction authorization reference number.
  - **CREDIT (KHATA)**: Books the invoice balance directly to the customer's ledger.
- **Bill Generation**:
  - Press `[F9]` or click **Pay** to finalize the sale and print the GST Tax Invoice / 80mm Thermal Receipt.
  - Press `[F2]` to clear the cart if customer cancels before payment.

---

## 3. Financial Reversals & Return Workflows
- **Audited Corrections**:
  - Cashiers cannot silently alter payment records or delete historical bills.
  - If a transaction requires reversal, an authorized Store Manager or Owner must execute the audited reversal via `POST /api/payments/:id/reversal` with a mandatory reason.
  - Stock is automatically restored and compensating negative entries are posted to preserve ledger balance.

