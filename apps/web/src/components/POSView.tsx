'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  BookOpen,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Ban,
  X,
  Store,
  Edit3,
  Check
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  Branch,
  BusinessTenant,
  Customer,
  Invoice,
  PaymentMode,
  Product
} from '@invodesk/types';
import { calculateInvoiceSummary, calculateItemTax, generateUPIPaymentUri } from '@invodesk/gst';

interface POSViewProps {
  tenant: BusinessTenant;
  activeBranch: Branch;
  products: Product[];
  customers: Customer[];
  onCompleteSale: (invoice: Invoice) => void;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onUpdateStoreName?: (newStoreName: string) => void;
  onOpenStoreSettings?: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  discountPercent: number;
  customUnitPrice?: number;
}

export const POSView: React.FC<POSViewProps> = ({
  tenant,
  activeBranch,
  products,
  customers,
  onCompleteSale,
  onOpenInvoiceModal,
  onUpdateStoreName,
  onOpenStoreSettings
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [hideOutOfStock, setHideOutOfStock] = useState<boolean>(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust_walkin');
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [stockAlertMessage, setStockAlertMessage] = useState<string | null>(null);
  const [isEditingStoreName, setIsEditingStoreName] = useState<boolean>(false);
  const [storeNameDraft, setStoreNameDraft] = useState<string>(tenant.tradeName || tenant.name || 'Apex Supermart');

  useEffect(() => {
    setStoreNameDraft(tenant.tradeName || tenant.name || 'Apex Supermart');
  }, [tenant.tradeName, tenant.name]);

  const handleSaveInlineStoreName = () => {
    const trimmed = storeNameDraft.trim();
    if (trimmed && onUpdateStoreName) {
      onUpdateStoreName(trimmed);
    }
    setIsEditingStoreName(false);
  };

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const showStockWarning = (msg: string) => {
    setStockAlertMessage(msg);
  };

  useEffect(() => {
    if (!stockAlertMessage) return;
    const timer = setTimeout(() => setStockAlertMessage(null), 3500);
    return () => clearTimeout(timer);
  }, [stockAlertMessage]);

  // Selected customer
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  // Determine if Inter-state (Customer state != Branch state)
  const isInterState = useMemo(() => {
    const custState = (selectedCustomer as any)?.billingAddress?.stateCode || (selectedCustomer as any)?.stateCode;
    const branchState = (activeBranch as any)?.address?.stateCode || (activeBranch as any)?.stateCode || '27';
    if (!custState) return false;
    return String(custState).trim() !== String(branchState).trim();
  }, [selectedCustomer, activeBranch]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products (In-stock products sorted first)
  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchSearch =
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.barcode && p.barcode.includes(searchTerm));
        const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
        const matchStock = !hideOutOfStock || p.currentStock > 0;
        return matchSearch && matchCat && matchStock;
      })
      .sort((a, b) => {
        // Put available stock items ahead of 0-stock items
        if (a.currentStock > 0 && b.currentStock <= 0) return -1;
        if (a.currentStock <= 0 && b.currentStock > 0) return 1;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, hideOutOfStock]);

  // Compute Cart Summary
  const cartSummary = useMemo(() => {
    const invoiceItems = cart.map((item, idx) => {
      const p = item.product;
      const unitPrice = item.customUnitPrice ?? p.sellingPrice;
      const taxCalc = calculateItemTax({
        quantity: item.quantity,
        unitPrice,
        discountPercent: item.discountPercent || billDiscountPercent,
        gstRate: p.gstRate,
        cessRate: p.cessRate,
        isInterState,
        isTaxInclusive: p.isTaxInclusive
      });

      return {
        id: `cart_${idx}`,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        hsnCode: p.hsnCode,
        unit: p.unit,
        quantity: item.quantity,
        unitPrice,
        discountPercent: item.discountPercent || billDiscountPercent,
        discountAmount: taxCalc.discountAmount,
        taxableAmount: taxCalc.taxableAmount,
        gstRate: p.gstRate,
        isInterState,
        cgstRate: taxCalc.cgstRate,
        cgstAmount: taxCalc.cgstAmount,
        sgstRate: taxCalc.sgstRate,
        sgstAmount: taxCalc.sgstAmount,
        igstRate: taxCalc.igstRate,
        igstAmount: taxCalc.igstAmount,
        cessAmount: taxCalc.cessAmount,
        totalAmount: taxCalc.totalAmount
      };
    });

    return calculateInvoiceSummary(invoiceItems);
  }, [cart, billDiscountPercent, isInterState]);

  // Cart operations with strict stock validation
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      showStockWarning(`Cannot add "${product.name}" — Out of Stock (0 ${product.unit} available).`);
      return;
    }

    const existing = cart.find(item => item.product.id === product.id);
    if (existing && existing.quantity >= product.currentStock) {
      showStockWarning(`Stock limit reached for "${product.name}" — only ${product.currentStock} ${product.unit} available.`);
      return;
    }

    setCart(prev => {
      const itemInCart = prev.find(item => item.product.id === product.id);
      if (itemInCart) {
        if (itemInCart.quantity >= product.currentStock) {
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, discountPercent: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    const liveProduct = products.find(p => p.id === productId);
    const existingItem = cart.find(i => i.product.id === productId);
    if (!existingItem) return;

    const maxAvailable = liveProduct ? liveProduct.currentStock : existingItem.product.currentStock;
    if (delta > 0 && existingItem.quantity + delta > maxAvailable) {
      showStockWarning(`Stock limit reached for "${existingItem.product.name}" — only ${maxAvailable} ${existingItem.product.unit} available.`);
      return;
    }

    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setBillDiscountPercent(0);
    setCashTendered('');
  };

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) setPaymentModalOpen(true);
      } else if (e.key === 'Escape' && paymentModalOpen) {
        setPaymentModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, paymentModalOpen]);

  // Generate UPI QR Code when modal opens or total changes
  useEffect(() => {
    if (paymentModalOpen && paymentMode === 'UPI' && cartSummary.grandTotal > 0) {
      const upiUri = generateUPIPaymentUri({
        vpa: 'apexretail@okaxis',
        payeeName: activeBranch.name,
        amount: cartSummary.grandTotal,
        transactionRef: `INV-${Date.now().toString().slice(-6)}`,
        note: `POS Counter Bill`
      });
      QRCode.toDataURL(upiUri, { width: 200, margin: 1 })
        .then(url => setUpiQrDataUrl(url))
        .catch(err => console.error('QR code error', err));
    }
  }, [paymentModalOpen, paymentMode, cartSummary.grandTotal, activeBranch.name]);

  // Cash change calculation
  const cashGivenNum = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, cashGivenNum - cartSummary.grandTotal);

  // Complete checkout
  const handleFinalizeSale = () => {
    if (cart.length === 0) return;

    // Final stock verification before billing
    for (const item of cart) {
      const liveProd = products.find(p => p.id === item.product.id) || item.product;
      if (liveProd.currentStock < item.quantity) {
        showStockWarning(`Insufficient stock for "${liveProd.name}" (Requested: ${item.quantity}, Available: ${liveProd.currentStock}).`);
        setPaymentModalOpen(false);
        return;
      }
    }

    const invoiceItems = cart.map((item, idx) => {
      const p = item.product;
      const unitPrice = item.customUnitPrice ?? p.sellingPrice;
      const taxCalc = calculateItemTax({
        quantity: item.quantity,
        unitPrice,
        discountPercent: item.discountPercent || billDiscountPercent,
        gstRate: p.gstRate,
        cessRate: p.cessRate,
        isInterState,
        isTaxInclusive: p.isTaxInclusive
      });

      return {
        id: `item_${Date.now()}_${idx}`,
        productId: p.id,
        name: p.name,
        sku: p.sku,
        hsnCode: p.hsnCode,
        unit: p.unit,
        quantity: item.quantity,
        unitPrice,
        discountPercent: item.discountPercent || billDiscountPercent,
        discountAmount: taxCalc.discountAmount,
        taxableAmount: taxCalc.taxableAmount,
        gstRate: p.gstRate,
        isInterState,
        cgstRate: taxCalc.cgstRate,
        cgstAmount: taxCalc.cgstAmount,
        sgstRate: taxCalc.sgstRate,
        sgstAmount: taxCalc.sgstAmount,
        igstRate: taxCalc.igstRate,
        igstAmount: taxCalc.igstAmount,
        cessAmount: taxCalc.cessAmount,
        totalAmount: taxCalc.totalAmount
      };
    });

    const nowIso = new Date().toISOString();
    const paidAmount = paymentMode === 'CREDIT_KHATA' ? 0 : cartSummary.grandTotal;
    const balanceAmount = cartSummary.grandTotal - paidAmount;

    const newInvoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tenantId: tenant.id,
      branchId: activeBranch.id,
      invoiceNumber: `INV/${activeBranch.code}/${new Date().getFullYear().toString().slice(-2)}/${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'TAX_INVOICE',
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || 'Walk-in Retail Customer',
      customerPhone: selectedCustomer?.phone,
      customerGstin: selectedCustomer?.gstin,
      customerStateCode:
        (selectedCustomer as any)?.billingAddress?.stateCode ||
        (selectedCustomer as any)?.stateCode ||
        (activeBranch as any)?.address?.stateCode ||
        (activeBranch as any)?.stateCode ||
        '27',
      placeOfSupplyStateCode:
        (selectedCustomer as any)?.billingAddress?.stateCode ||
        (selectedCustomer as any)?.stateCode ||
        (activeBranch as any)?.address?.stateCode ||
        (activeBranch as any)?.stateCode ||
        '27',
      isInterState,
      items: invoiceItems,
      subTotal: cartSummary.subTotal,
      totalDiscount: cartSummary.totalDiscount,
      taxableAmount: cartSummary.taxableAmount,
      totalCgst: cartSummary.totalCgst,
      totalSgst: cartSummary.totalSgst,
      totalIgst: cartSummary.totalIgst,
      totalCess: cartSummary.totalCess,
      totalTax: cartSummary.totalTax,
      roundOff: cartSummary.roundOff,
      grandTotal: cartSummary.grandTotal,
      paymentStatus: balanceAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'UNPAID'),
      paidAmount,
      balanceAmount,
      payments: [
        {
          id: `pay_${Date.now()}`,
          mode: paymentMode,
          amount: paidAmount,
          referenceNumber:
            paymentReference.trim() ||
            (paymentMode === 'UPI'
              ? 'UPI-VERIFIED-COUNTER'
              : paymentMode === 'CARD'
              ? 'POS-CARD-AUTH'
              : paymentMode === 'CREDIT_KHATA'
              ? 'KHATA-LEDGER-DUE'
              : undefined),
          paidAt: nowIso
        }
      ],
      notes,
      isSynced: true,
      syncVersion: 1,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    onCompleteSale(newInvoice);
    setPaymentModalOpen(false);
    setPaymentReference('');
    clearCart();
    onOpenInvoiceModal(newInvoice);
  };

  // Barcode simulation (only picks from available stock items)
  const handleSimulateScan = () => {
    const inStockProducts = products.filter(p => p.currentStock > 0);
    if (inStockProducts.length === 0) {
      showStockWarning('No in-stock products available to scan.');
      return;
    }
    const randomProduct = inStockProducts[Math.floor(Math.random() * inStockProducts.length)];
    if (randomProduct) {
      addToCart(randomProduct);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 390px',
        gap: 18,
        height: 'calc(100vh - 96px)',
        minHeight: 580
      }}
    >
      {/* Left: Product Search, Category Pills & Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0, minWidth: 0 }}>
        {/* Stock Warning Toast */}
        {stockAlertMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.35)',
              color: 'var(--accent-danger)',
              fontSize: '0.84rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} />
              <span>{stockAlertMessage}</span>
            </div>
            <button
              onClick={() => setStockAlertMessage(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-danger)',
                cursor: 'pointer',
                padding: 2
              }}
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Search & Barcode Action Bar */}
        <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Search product by Name, SKU, or scan Barcode (e.g. 8901030456123)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ paddingLeft: 40 }}
            />
          </div>

          <button
            onClick={() => setHideOutOfStock(!hideOutOfStock)}
            className={`btn btn-sm ${hideOutOfStock ? 'btn-primary' : 'btn-outline'}`}
            style={{ height: 40, padding: '0 12px', whiteSpace: 'nowrap' }}
            title="Hide products with 0 stock"
          >
            {hideOutOfStock ? 'In-Stock Only' : 'Hide 0 Stock'}
          </button>

          <button
            onClick={handleSimulateScan}
            className="btn btn-outline"
            style={{ height: 40, whiteSpace: 'nowrap' }}
            title="Simulate hardware barcode scanner reading an item"
          >
            <Barcode size={18} color="var(--brand-emerald-dark)" />
            Scan Barcode
          </button>
        </div>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2, flexShrink: 0 }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
              style={{ whiteSpace: 'nowrap', borderRadius: 20, padding: '6px 14px' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(225px, 1fr))',
            gridAutoRows: 'max-content',
            gap: 14,
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            paddingRight: 4,
            paddingBottom: 8
          }}
        >
          {filteredProducts.map(product => {
            const isOutOfStock = product.currentStock <= 0;
            const isLowStock = !isOutOfStock && product.currentStock <= product.minStockAlert;
            const inCart = cart.find(i => i.product.id === product.id);
            const isAtMaxStock = inCart ? inCart.quantity >= product.currentStock : false;

            return (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className="glass-panel"
                style={{
                  padding: 16,
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12,
                  transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                  border: inCart
                    ? '2px solid var(--brand-emerald)'
                    : '1px solid var(--border-subtle)',
                  background: inCart
                    ? 'var(--brand-emerald-light)'
                    : isOutOfStock
                    ? 'var(--bg-tertiary)'
                    : 'var(--bg-card)'
                }}
                onMouseEnter={(e) => {
                  if (!isOutOfStock) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--brand-emerald)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = inCart ? 'var(--brand-emerald)' : 'var(--border-subtle)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {product.sku}
                    </span>
                    <span
                      className={`badge ${
                        isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'
                      }`}
                      style={{ flexShrink: 0 }}
                    >
                      {isOutOfStock
                        ? 'Out of Stock'
                        : isLowStock
                        ? `Low: ${product.currentStock} ${product.unit}`
                        : `${product.currentStock} ${product.unit}`}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 4, lineHeight: 1.35 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    HSN: {product.hsnCode} • GST: {product.gstRate}%
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    paddingTop: 10,
                    borderTop: '1px solid var(--border-subtle)'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isOutOfStock ? 'var(--text-muted)' : 'var(--brand-emerald-dark)' }}>
                      ₹{product.sellingPrice.toLocaleString('en-IN')}
                    </span>
                    {product.mrp > product.sellingPrice && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through', marginLeft: 6 }}>
                        ₹{product.mrp}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: isOutOfStock
                        ? 'rgba(220, 38, 38, 0.1)'
                        : inCart
                        ? 'var(--brand-emerald)'
                        : 'var(--bg-tertiary)',
                      border: inCart || isOutOfStock ? 'none' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isOutOfStock
                        ? 'var(--accent-danger)'
                        : inCart
                        ? '#ffffff'
                        : 'var(--brand-emerald-dark)'
                    }}
                    title={
                      isOutOfStock
                        ? 'Out of Stock'
                        : isAtMaxStock
                        ? `Max stock (${product.currentStock}) in cart`
                        : 'Add to bill'
                    }
                  >
                    {isOutOfStock ? (
                      <Ban size={15} />
                    ) : inCart ? (
                      <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>{inCart.quantity}</span>
                    ) : (
                      <Plus size={16} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Checkout Ledger & Tax Breakdown */}
      <div
        className="glass-panel"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 18,
          height: '100%',
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Customer Header, Store Name on Bill & Inter/Intra State Badge */}
        <div style={{ flexShrink: 0 }}>
          {/* Store Name on Bill Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 6,
              background: 'var(--brand-emerald-light)',
              border: '1px solid var(--border-brand)',
              borderRadius: 8,
              padding: '6px 10px',
              marginBottom: 10
            }}
          >
            {isEditingStoreName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
                <Store size={14} color="var(--brand-emerald-dark)" style={{ flexShrink: 0 }} />
                <input
                  type="text"
                  value={storeNameDraft}
                  onChange={(e) => setStoreNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveInlineStoreName();
                    if (e.key === 'Escape') setIsEditingStoreName(false);
                  }}
                  placeholder="Enter Store Name for Bill..."
                  className="input-field"
                  style={{ height: 28, padding: '2px 8px', fontSize: '0.78rem', fontWeight: 700, flex: 1 }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveInlineStoreName}
                  className="btn btn-primary btn-sm"
                  style={{ height: 28, padding: '0 8px', fontSize: '0.72rem' }}
                  title="Save Store Name"
                >
                  <Check size={13} /> Save
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <Store size={14} color="var(--brand-emerald-dark)" style={{ flexShrink: 0 }} />
                  <div style={{ fontSize: '0.76rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Store on Bill: </span>
                    <strong style={{ color: 'var(--brand-emerald-dark)' }}>
                      {tenant.tradeName || tenant.name}
                    </strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingStoreName(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    background: 'var(--bg-card)',
                    color: 'var(--brand-emerald-dark)',
                    border: '1px solid var(--border-brand)',
                    borderRadius: 5,
                    padding: '2px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Change Store Name printed on Bill"
                >
                  <Edit3 size={11} /> Edit Store
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={16} color="var(--brand-emerald-dark)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Billing To</span>
            </div>

            <span className={`badge ${isInterState ? 'badge-warning' : 'badge-indigo'}`}>
              {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}
            </span>
          </div>

          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="input-field"
            style={{ marginBottom: 6, fontSize: '0.84rem', padding: '8px 12px' }}
          >
            {customers.map(c => (
              <option key={c.id} value={c.id} style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
                {c.name} {c.gstin ? `(GSTIN: ${c.gstin})` : '(Retail)'}
              </option>
            ))}
          </select>

          {selectedCustomer?.gstin && (
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                background: 'var(--brand-emerald-light)',
                border: '1px solid var(--border-brand)',
                padding: '4px 8px',
                borderRadius: 6,
                marginBottom: 4
              }}
            >
              GSTIN: <strong style={{ color: 'var(--text-main)' }}>{selectedCustomer.gstin}</strong> | POS: State {selectedCustomer.billingAddress?.stateCode} ({selectedCustomer.billingAddress?.state})
            </div>
          )}
        </div>

        {/* Cart Item Rows (Scrollable middle area) */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            margin: '10px 0',
            borderTop: '1px solid var(--border-subtle)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '10px 4px 10px 0'
          }}
        >
          {cart.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                gap: 8,
                textAlign: 'center',
                padding: 20
              }}
            >
              <Barcode size={38} strokeWidth={1.5} color="var(--brand-emerald-dark)" />
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Bill Cart is Empty</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Click any in-stock product on the left or scan a barcode to start billing
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.map((item) => {
                const p = item.product;
                const liveProd = products.find(prod => prod.id === p.id) || p;
                const unitPrice = item.customUnitPrice ?? p.sellingPrice;
                const lineTotal = item.quantity * unitPrice;
                const atStockCap = item.quantity >= liveProd.currentStock;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ maxWidth: 230 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ₹{unitPrice.toLocaleString('en-IN')} / {p.unit} • GST {p.gstRate}% • Avail: {liveProd.currentStock}
                        </div>
                      </div>

                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        ₹{lineTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: '2px 8px', height: 26 }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: 24, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          disabled={atStockCap}
                          className="btn btn-outline btn-sm"
                          style={{
                            padding: '2px 8px',
                            height: 26,
                            opacity: atStockCap ? 0.45 : 1,
                            cursor: atStockCap ? 'not-allowed' : 'pointer'
                          }}
                          title={atStockCap ? `Maximum available stock (${liveProd.currentStock}) reached` : 'Increase quantity'}
                        >
                          <Plus size={12} />
                        </button>
                        {atStockCap && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-warning)', fontWeight: 600 }}>
                            Max stock
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(p.id)}
                        className="btn btn-sm"
                        style={{ color: 'var(--accent-danger)', background: 'transparent', padding: '2px 6px' }}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GST & Totals Calculation Box (Pinned at bottom of checkout panel) */}
        <div style={{ flexShrink: 0 }}>
          {/* Payment Method on Bill Quick Selector */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                Payment Method on Bill
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                {paymentMode === 'CREDIT_KHATA' ? 'CREDIT (KHATA)' : paymentMode}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
              {([
                { id: 'CASH', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI', icon: QrCode },
                { id: 'CARD', label: 'Card', icon: CreditCard },
                { id: 'CREDIT_KHATA', label: 'Khata', icon: BookOpen }
              ] as { id: PaymentMode; label: string; icon: any }[]).map((m) => {
                const Icon = m.icon;
                const active = paymentMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMode(m.id)}
                    className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline'}`}
                    style={{
                      padding: '5px 4px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                      borderRadius: 7
                    }}
                  >
                    <Icon size={13} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Taxable Amount</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>₹{cartSummary.taxableAmount.toLocaleString('en-IN')}</span>
            </div>

            {!isInterState ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>CGST</span>
                  <span style={{ color: 'var(--text-main)' }}>+₹{cartSummary.totalCgst.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>SGST</span>
                  <span style={{ color: 'var(--text-main)' }}>+₹{cartSummary.totalSgst.toLocaleString('en-IN')}</span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IGST (Integrated Tax)</span>
                <span style={{ color: 'var(--text-main)' }}>+₹{cartSummary.totalIgst.toLocaleString('en-IN')}</span>
              </div>
            )}

            {cartSummary.roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Round Off</span>
                <span>{cartSummary.roundOff > 0 ? `+₹${cartSummary.roundOff}` : `-₹${Math.abs(cartSummary.roundOff)}`}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingTop: 6,
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 3
              }}
            >
              <span style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-main)' }}>Grand Total</span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--brand-emerald-dark)'
                }}
              >
                ₹{cartSummary.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Quick Shortcuts & Pay Button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={clearCart}
              disabled={cart.length === 0}
              className="btn btn-outline"
              style={{ flex: '0 0 auto', padding: '10px 14px', opacity: cart.length === 0 ? 0.5 : 1 }}
              title="Press [F2] to reset"
            >
              F2 Clear
            </button>

            <button
              onClick={() => setPaymentModalOpen(true)}
              disabled={cart.length === 0}
              className="btn btn-success btn-lg"
              style={{ flex: 1, padding: '10px 16px', opacity: cart.length === 0 ? 0.6 : 1 }}
              title="Press [F9] to checkout"
            >
              <CreditCard size={18} />
              Pay ₹{cartSummary.grandTotal.toLocaleString('en-IN')} ({paymentMode === 'CREDIT_KHATA' ? 'KHATA' : paymentMode}) [F9]
            </button>
          </div>
        </div>
      </div>

      {/* Checkout & Payment Modal */}
      {paymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 520, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: 'var(--brand-emerald-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--brand-emerald-dark)'
                  }}
                >
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Settle Payment &amp; Bill</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Store: <strong>{tenant.tradeName || tenant.name}</strong> • Payable: ₹{cartSummary.grandTotal.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPaymentModalOpen(false)}
                className="btn btn-outline btn-sm"
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Payment Modes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
              {(['CASH', 'UPI', 'CARD', 'CREDIT_KHATA'] as PaymentMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`btn btn-sm ${paymentMode === mode ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '12px 6px',
                    gap: 6,
                    height: 'auto'
                  }}
                >
                  {mode === 'CASH' && <Banknote size={20} />}
                  {mode === 'UPI' && <QrCode size={20} />}
                  {mode === 'CARD' && <CreditCard size={20} />}
                  {mode === 'CREDIT_KHATA' && <BookOpen size={20} />}
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    {mode === 'CREDIT_KHATA' ? 'Khata Ledger' : mode}
                  </span>
                </button>
              ))}
            </div>

            {/* Mode-Specific Content */}
            {paymentMode === 'CASH' && (
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 20
                }}
              >
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  Cash Tendered by Customer (₹)
                </label>
                <input
                  type="number"
                  placeholder={`e.g. ${cartSummary.grandTotal}`}
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="input-field"
                  style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 12 }}
                  autoFocus
                />

                {/* Quick denomination pills */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[100, 200, 500, 1000, 2000].map(amt => (
                    <button
                      key={amt}
                      onClick={() => setCashTendered(amt.toString())}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.72rem' }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => setCashTendered(cartSummary.grandTotal.toString())}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.72rem', color: 'var(--brand-emerald-dark)' }}
                  >
                    Exact
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Change to Return:</span>
                  <span
                    style={{
                      fontSize: '1.3rem',
                      fontWeight: 800,
                      color: changeToReturn > 0 ? 'var(--brand-emerald-dark)' : 'var(--text-muted)'
                    }}
                  >
                    ₹{changeToReturn.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {paymentMode === 'UPI' && (
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 20
                }}
              >
                {upiQrDataUrl ? (
                  <div style={{ background: '#ffffff', padding: 8, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                    <img src={upiQrDataUrl} alt="UPI QR Code" style={{ width: 150, height: 150, display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: 150, height: 150, background: 'var(--bg-tertiary)', borderRadius: 10 }} />
                )}
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <span className="badge badge-success" style={{ marginBottom: 4 }}>
                    Dynamic NPCI QR Generated
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                    Scan with Google Pay, PhonePe, Paytm, or BHIM
                  </p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Optional UPI Ref / UTR Number (printed on bill)"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                </div>
              </div>
            )}

            {paymentMode === 'CARD' && (
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CreditCard size={18} color="var(--brand-emerald-dark)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Debit / Credit Card Terminal Settlement
                  </span>
                </div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Card Approval / RRN Reference (Optional - printed on bill)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. RRN-448291 / VISA-4921"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            )}

            {paymentMode === 'CREDIT_KHATA' && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: 16,
                  borderRadius: 12,
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  marginBottom: 20
                }}
              >
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-warning)' }}>
                    Customer Khata Ledger Booking
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Bill of <strong>₹{cartSummary.grandTotal.toLocaleString('en-IN')}</strong> will be added to{' '}
                  <strong>{selectedCustomer.name}</strong>'s outstanding balance. Current balance:{' '}
                  ₹{selectedCustomer.currentBalance.toLocaleString('en-IN')}.
                </p>
              </div>
            )}

            <button
              onClick={handleFinalizeSale}
              className="btn btn-success btn-lg"
              style={{ width: '100%' }}
            >
              <CheckCircle2 size={18} />
              Confirm & Generate GST Invoice
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
