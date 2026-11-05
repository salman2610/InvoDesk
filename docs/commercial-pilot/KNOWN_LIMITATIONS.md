# InvoDesk Commercial Pilot: Known Limitations & Operational Boundaries

This document defines technical boundaries, rate envelopes, and operational parameters for the 5–10 business commercial pilot.

---

## 1. Concurrency & Network Limits
- **Simultaneous Terminal Checkouts**: Verified up to 15 concurrent POS terminals per store branch with zero invoice sequence collisions.
- **Offline Mutation Queue**: The client-side indexed sync queue can store up to 5,000 offline invoice mutations per terminal before requiring upstream synchronization.

---

## 2. Hardware Interfaces
- **Receipt Printers**: ESC/POS thermal printers connected over USB, Bluetooth, or TCP network sockets (80mm / 58mm width). Page-mode graphical rendering is handled via browser print.
- **Barcode Scanners**: Keyboard-wedge HID scanners operating with automatic `<CR>` carriage-return suffixes.
- **Cash Drawers**: Standard RJ-11/RJ-12 solenoid kick pins (Pin 2 standard, Pin 5 auxiliary).

---

## 3. Subscription & Multi-Tenant Entitlements
- **Starter Trial Tier**: Limited to 1 Branch, 2 Active Terminals, 3 Users, and 250 Products.
- **Growth Tier**: Limited to 3 Branches, 6 Terminals, 10 Users, and 2,500 Products.
- **Enterprise Tier**: Supports up to 50 Branches, 200 Terminals, 250 Users, and 100,000 Products.

---

## 4. Financial Integrity Guardrails
- **Payment Immutability**: Settled payments cannot be altered. Corrections must be handled via audited reversal (`POST /api/payments/:id/reversal`).
- **Audit Log Append-Only**: Database-level PostgreSQL triggers prevent any update or deletion of `AuditLog` records.
- **UPI QR Verification**: Dynamic NPCI UPI QR code generation does not represent payment confirmation. Transactions are marked confirmed only upon cashier verification or receipt of a cryptographically signed payment webhook.

