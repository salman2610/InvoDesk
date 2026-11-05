# InvoDesk Store Administrator & Pilot Operations Guide

This guide is intended for Business Owners, Store Administrators, and IT Operators managing InvoDesk in a production retail environment.

---

## 1. Multi-Tenant Architecture & Data Security
- InvoDesk enforces strict tenant isolation on every API request.
- Every entity (Branch, User, Product, Customer, Invoice, Payment, Terminal, Audit Log) is scoped to the tenant's primary identifier.
- Users and cashiers belonging to one business cannot view or query records from another business.

---

## 2. Managing Outlets & Branches
- Store names can be customized via the UI and Settings modal.
- Adding a new outlet branch is governed by subscription entitlements:
  - **Starter Trial**: 1 Branch
  - **Growth**: Up to 3 Branches
  - **Enterprise**: Up to 50 Branches
- To add a branch: Use the UI Settings modal or call `POST /api/branches`.

---

## 3. SaaS Subscription Management
- All subscriptions and plan limits are validated server-side.
- Upgrades can be performed via `POST /api/subscription/upgrade` with immediate entitlement adjustments.
- Current subscription health and usage can be monitored via `GET /api/subscription`.

---

## 4. Immutable Audit Trail
- System actions (onboarding, invoice cancellations, stock adjustments, payment reversals, and plan changes) are logged to the `AuditLog` table.
- PostgreSQL database triggers prevent any modification or deletion of audit records.
- Audit logs can be reviewed via `GET /api/audit-logs`.

