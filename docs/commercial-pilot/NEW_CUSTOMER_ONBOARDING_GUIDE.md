# InvoDesk Commercial Pilot: New Customer Onboarding Guide

Welcome to the **InvoDesk (v3.0.0)** commercial pilot program for independent retail stores, supermarkets, and electronics distributors.

---

## 1. Quick Onboarding Checklist
To register your business on the InvoDesk cloud engine:

1. **Submit Business Onboarding (`POST /api/onboarding`)**:
   - Legal Business Name & Trade / Store Name
   - GSTIN (15-digit Indian GST Identification Number) & PAN
   - Registered Business Address & 2-digit GST State Code (e.g. `27` for Maharashtra, `29` for Karnataka)
   - Store Owner Name, Email, and Secure Password
   - Primary Outlet / Branch code (e.g. `MUM-01`, `PUN-01`)
2. **Access Your Dashboard**:
   - Open Web POS at `http://localhost:3000` (or your cloud URL)
   - Log in using your registered Owner credentials
3. **Configure POS Terminal**:
   - Register your lane counter in Settings -> POS Hardware
   - Link USB / Bluetooth ESC/POS receipt printer (80mm / 58mm)
   - Verify keyboard-wedge barcode scanner listener

---

## 2. Default Trial Plan
All new businesses begin on the **Starter 14-Day Free Trial**:
- **1 Store Branch**
- **Up to 2 Active POS Terminals**
- **Up to 3 Cashier / Manager Accounts**
- **Up to 250 Active Catalog Products**
- **Complete GST Tax Invoicing & GSTR-1 Summaries Included**

To scale to multiple branches or warehouse inventory, upgrade anytime to **Growth** or **Enterprise** under `POST /api/subscription/upgrade`.

