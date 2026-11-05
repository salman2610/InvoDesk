/**
 * InvoDesk Core TypeScript Type Definitions
 * Shared across Fastify API, Next.js Web, Desktop & Mobile clients.
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'CASHIER' | 'INVENTORY_MANAGER';

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  branchIds: string[];
  createdAt: string;
}

export interface BusinessTenant {
  id: string;
  name: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  phone: string;
  email: string;
  address: Address;
  currency: string;
  logoUrl?: string;
  stateCode: string; // 2-digit GST state code e.g. "27" (Maharashtra), "29" (Karnataka), "07" (Delhi)
  stateName: string;
  isCompositionScheme: boolean;
  termsAndConditions?: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  gstin?: string;
  phone: string;
  address: Address;
  isMainBranch: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  stateCode: string; // 2 digit GST state code
  pincode: string;
  country: string;
}

export type UnitOfMeasure = 'PCS' | 'BOX' | 'KG' | 'GM' | 'LTR' | 'ML' | 'MTR' | 'PACK';

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category: string;
  brand?: string;
  unit: UnitOfMeasure;
  hsnCode: string;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  cessRate?: number; // % cess if applicable
  purchasePrice: number; // Cost price excl. tax
  sellingPrice: number; // Base selling price excl. tax
  mrp: number; // Maximum Retail Price (incl tax)
  isTaxInclusive: boolean;
  currentStock: number;
  minStockAlert: number;
  batchNumber?: string;
  expiryDate?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  branchId: string;
  quantityDelta: number; // + for add, - for reduce
  previousStock: number;
  newStock: number;
  reason: 'PURCHASE' | 'SALE' | 'DAMAGE' | 'RETURN' | 'AUDIT_CORRECTION' | 'THEFT' | 'TRANSFER';
  note?: string;
  userId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  billingAddress: Address;
  shippingAddress?: Address;
  creditLimit: number;
  currentBalance: number; // Positive = customer owes us; Negative = advance
  loyaltyPoints?: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  gstin?: string;
  address: Address;
  currentPayable: number;
  createdAt: string;
}

export type InvoiceType = 'TAX_INVOICE' | 'RETAIL_BILL' | 'PROFORMA' | 'ESTIMATE' | 'CREDIT_NOTE';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'CREDIT_KHATA' | 'SPLIT';

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  hsnCode: string;
  unit: UnitOfMeasure;
  quantity: number;
  unitPrice: number; // Price per unit
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number; // Net amount on which GST is applied
  gstRate: number;
  isInterState: boolean;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  cessAmount: number;
  totalAmount: number; // Final item total incl tax
}

export interface GSTBreakdownItem {
  hsnCode: string;
  taxableAmount: number;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTax: number;
}

export interface PaymentEntry {
  id: string;
  mode: PaymentMode;
  amount: number;
  referenceNumber?: string; // UPI ref / transaction ID
  paidAt: string;
}

export interface Invoice {
  id: string;
  localId?: string; // Offline client generated ID
  tenantId: string;
  branchId: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  type: InvoiceType;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerStateCode?: string;
  placeOfSupplyStateCode: string;
  isInterState: boolean; // true if customer State != branch State (triggers IGST instead of CGST+SGST)
  
  items: InvoiceItem[];
  
  subTotal: number; // Sum of taxable amounts before discounts
  totalDiscount: number;
  taxableAmount: number;
  
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalCess: number;
  totalTax: number;
  
  roundOff: number;
  grandTotal: number;
  
  paymentStatus: PaymentStatus;
  paidAmount: number;
  balanceAmount: number;
  payments: PaymentEntry[];
  
  notes?: string;
  terms?: string;
  qrCodeData?: string; // UPI dynamic payment link / GST IRN QR
  isSynced: boolean;
  syncVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface GSTR1Summary {
  period: string; // e.g. "OCT-2026"
  totalInvoices: number;
  totalTaxableAmount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalInvoiceValue: number;
  b2bInvoicesCount: number; // Invoices with customer GSTIN
  b2csInvoicesCount: number; // Consumer invoices intra-state or small inter-state
  b2clInvoicesCount: number; // Consumer invoices inter-state > 2.5 Lakh
  hsnSummary: GSTBreakdownItem[];
}

export interface BusinessDashboardStats {
  todaySales: number;
  todaySalesCount: number;
  monthRevenue: number;
  monthRevenueGrowth: number;
  totalReceivables: number; // Pending customer khata
  totalPayables: number; // Pending supplier payments
  inventoryValuation: number;
  lowStockItemsCount: number;
  topSellingProducts: {
    productId: string;
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  recentInvoices: Invoice[];
}

/**
 * Offline Synchronization Models
 */
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncEntityType = 'INVOICE' | 'PRODUCT' | 'CUSTOMER' | 'STOCK_ADJUSTMENT' | 'PAYMENT';

export interface SyncRecord {
  id: string; // UUID of mutation
  clientTransactionId: string;
  tenantId: string;
  branchId: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  entityId: string;
  payload: any;
  clientTimestamp: number;
  serverTimestamp?: number;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'REJECTED';
  conflictDetails?: string;
}

export interface SyncPushRequest {
  branchId: string;
  records: SyncRecord[];
  lastSyncedTimestamp: number;
}

export interface SyncPushResponse {
  syncedIds: string[];
  conflicts: {
    recordId: string;
    entityId: string;
    reason: string;
    serverEntityState?: any;
    resolution: 'CLIENT_ACCEPTED' | 'SERVER_KEPT' | 'MANUAL_REQUIRED';
  }[];
  serverTimestamp: number;
}

export interface SyncPullResponse {
  updatedProducts: Product[];
  updatedCustomers: Customer[];
  updatedInvoices: Invoice[];
  serverTimestamp: number;
}

/**
 * ============================================================================
 * Phase 4: POS Hardware & Payment Provider Abstractions
 * ============================================================================
 */

export type PrinterPaperWidth = '58mm' | '80mm';
export type PrinterConnectionType = 'USB' | 'BLUETOOTH' | 'NETWORK_TCP' | 'SIMULATED';

export interface PrinterStatus {
  isOnline: boolean;
  paperStatus: 'OK' | 'LOW' | 'OUT';
  coverOpen: boolean;
  isSimulated?: boolean;
  lastError?: string;
  temperature?: number;
}

export interface PrintReceiptOptions {
  paperWidth: PrinterPaperWidth;
  openDrawer?: boolean;
  cutPaper?: boolean;
  barcodeQr?: boolean;
  copies?: number;
}

export type ScannerInterfaceType = 'KEYBOARD_WEDGE' | 'USB_HID' | 'SERIAL' | 'SIMULATED';

export interface ScanEvent {
  barcode: string;
  scanDurationMs: number;
  timestamp: number;
  rawInput: string;
}

export interface BarcodeLookupResult {
  found: boolean;
  product?: Product;
  barcode: string;
  requiresRegistration: boolean;
}

export type CashDrawerInterface = 'PRINTER_DRIVEN' | 'USB_SERIAL' | 'SIMULATED';

export interface CashDrawerStatus {
  isOpen: boolean;
  lastOpenedAt?: number;
  openedBy?: string;
  reason?: string;
  isSimulated?: boolean;
}

export type CashierShiftStatus = 'OPEN' | 'CLOSED';

export interface CashierShift {
  id: string;
  tenantId: string;
  branchId: string;
  userId: string;
  userName?: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSalesTotal: number;
  cashReturnsTotal: number;
  cashDropsTotal: number;
  expectedCash: number;
  actualCashCounted?: number;
  cashDifference?: number; // actual - expected (+ surplus, - shortage)
  status: CashierShiftStatus;
  totalTransactionsCount: number;
  notes?: string;
}

export interface CashDropEntry {
  id: string;
  shiftId: string;
  type: 'DROP' | 'PAYOUT';
  amount: number;
  reason: string;
  timestamp: number;
}

export type PaymentProviderName = 'UPI_NPCI' | 'RAZORPAY' | 'STRIPE' | 'PAYTM' | 'CASH';
export type PaymentTransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentOrderRequest {
  invoiceId: string;
  amount: number;
  currency?: string;
  customerId?: string;
  customerPhone?: string;
  idempotencyKey: string;
  notes?: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  provider: PaymentProviderName;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  clientSecret?: string;
  qrCodeData?: string;
  expiresAt: number;
}

export interface PaymentWebhookPayload {
  event: string;
  orderId: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: PaymentTransactionStatus;
  signature: string;
  timestamp: number;
  rawPayload?: any;
}

export interface PaymentVerificationResult {
  verified: boolean;
  orderId: string;
  paymentId: string;
  status: PaymentTransactionStatus;
  amount: number;
  settledAt: number;
  failureReason?: string;
}

/**
 * ============================================================================
 * Phase 6: SaaS Subscription, Onboarding, Terminal & Audit Models
 * ============================================================================
 */

export type SubscriptionPlanTier = 'STARTER_TRIAL' | 'GROWTH' | 'ENTERPRISE';
export type BillingCycle = 'TRIAL' | 'MONTHLY' | 'ANNUAL';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export interface PlanEntitlements {
  maxBranches: number;
  maxTerminals: number;
  maxUsers: number;
  maxProducts: number;
  gstr1Export: boolean;
  multiWarehouse: boolean;
  auditLogs: boolean;
}

export interface TenantSubscription {
  tenantId: string;
  planTier: SubscriptionPlanTier;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  trialStartsAt?: string;
  trialEndsAt?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  paymentProvider?: 'RAZORPAY' | 'STRIPE' | 'MANUAL';
  externalSubscriptionId?: string;
  entitlements: PlanEntitlements;
  usage: {
    branchesCount: number;
    terminalsCount: number;
    usersCount: number;
    productsCount: number;
  };
}

export interface POSTerminal {
  id: string;
  tenantId: string;
  branchId: string;
  terminalCode: string;
  deviceName: string;
  registeredBy: string;
  lastHeartbeatAt: string;
  isActive: boolean;
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'INVOICE' | 'PAYMENT' | 'PRODUCT' | 'STOCK' | 'SUBSCRIPTION' | 'AUTH' | 'TENANT';
  entityId: string;
  reason?: string;
  previousState?: any;
  newState?: any;
  timestamp: string;
}

export interface BusinessOnboardingRequest {
  businessName: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  phone: string;
  email: string;
  stateCode: string;
  stateName: string;
  address: {
    street: string;
    city: string;
    pincode: string;
  };
  isCompositionScheme?: boolean;
  termsAndConditions?: string;
  mainBranch: {
    name: string;
    code: string;
    phone?: string;
  };
  owner: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  };
  planTier?: SubscriptionPlanTier;
  billingCycle?: BillingCycle;
}


