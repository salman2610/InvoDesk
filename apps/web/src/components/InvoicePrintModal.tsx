'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  FileCheck,
  Store,
  CreditCard
} from 'lucide-react';
import { BusinessTenant, Invoice, PaymentMode } from '@invodesk/types';
import { buildWhatsAppShareUrl } from '@invodesk/billing';
import { BrandLogo } from './BrandLogo';

interface InvoicePrintModalProps {
  invoice: Invoice | null;
  tenant: BusinessTenant;
  activeBranchName?: string;
  onUpdateStoreName?: (newStoreName: string) => void;
  onUpdateInvoicePayment?: (invoiceId: string, mode: PaymentMode, referenceNumber?: string) => void;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  tenant,
  activeBranchName,
  onUpdateStoreName,
  onUpdateInvoicePayment,
  onClose
}) => {
  const [printFormat, setPrintFormat] = useState<'A4_TAX_INVOICE' | 'THERMAL_RECEIPT'>('A4_TAX_INVOICE');
  const [billStoreName, setBillStoreName] = useState<string>(tenant.tradeName || tenant.name || 'Apex Supermart');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentRef, setPaymentRef] = useState<string>('');

  useEffect(() => {
    setBillStoreName(tenant.tradeName || tenant.name || 'Apex Supermart');
  }, [tenant.tradeName, tenant.name]);

  useEffect(() => {
    if (invoice) {
      const initialMode: PaymentMode =
        invoice.payments?.[0]?.mode ||
        (invoice.paymentStatus === 'UNPAID' ? 'CREDIT_KHATA' : 'CASH');
      setSelectedPaymentMode(initialMode);
      setPaymentRef(invoice.payments?.[0]?.referenceNumber || '');
    }
  }, [invoice]);

  if (!invoice) return null;

  const formatPaymentModeLabel = (mode: PaymentMode | string) => {
    switch (mode) {
      case 'CASH':
        return 'CASH';
      case 'UPI':
        return 'UPI (QR / Instant)';
      case 'CARD':
        return 'CARD (Debit / Credit)';
      case 'CREDIT_KHATA':
        return 'CREDIT (Khata Ledger)';
      case 'BANK_TRANSFER':
        return 'BANK TRANSFER (NEFT/RTGS)';
      default:
        return mode;
    }
  };

  const handleStoreNameChange = (val: string) => {
    setBillStoreName(val);
    if (onUpdateStoreName && val.trim()) {
      onUpdateStoreName(val.trim());
    }
  };

  const handlePaymentModeChange = (mode: PaymentMode) => {
    setSelectedPaymentMode(mode);
    if (onUpdateInvoicePayment) {
      onUpdateInvoicePayment(invoice.id, mode, paymentRef);
    }
  };

  const handlePaymentRefChange = (refVal: string) => {
    setPaymentRef(refVal);
    if (onUpdateInvoicePayment) {
      onUpdateInvoicePayment(invoice.id, selectedPaymentMode, refVal);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const url = buildWhatsAppShareUrl(invoice, billStoreName || tenant.name);
    window.open(url, '_blank');
  };

  const effectivePaidAmount =
    selectedPaymentMode === 'CREDIT_KHATA' ? 0 : invoice.grandTotal;
  const effectiveBalanceAmount =
    selectedPaymentMode === 'CREDIT_KHATA' ? invoice.grandTotal : 0;
  const effectivePaymentStatus =
    selectedPaymentMode === 'CREDIT_KHATA' ? 'UNPAID (KHATA)' : 'PAID';

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ width: 880, maxWidth: '95vw', padding: 0 }}>
        {/* Modal Top Header (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileCheck size={22} color="var(--brand-emerald-dark)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Invoice: {invoice.invoiceNumber}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Store: <strong>{billStoreName}</strong> • Paid via: <strong>{formatPaymentModeLabel(selectedPaymentMode)}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Format toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: 3, borderRadius: 8 }}>
              <button
                onClick={() => setPrintFormat('A4_TAX_INVOICE')}
                className={`btn btn-sm ${printFormat === 'A4_TAX_INVOICE' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', fontSize: '0.75rem' }}
              >
                A4 Tax Invoice
              </button>
              <button
                onClick={() => setPrintFormat('THERMAL_RECEIPT')}
                className={`btn btn-sm ${printFormat === 'THERMAL_RECEIPT' ? 'btn-primary' : 'btn-outline'}`}
                style={{ border: 'none', fontSize: '0.75rem' }}
              >
                80mm Thermal Slip
              </button>
            </div>

            <button onClick={handlePrint} className="btn btn-primary btn-sm">
              <Printer size={15} />
              Print Bill
            </button>

            <button onClick={handleWhatsApp} className="btn btn-success btn-sm">
              <Share2 size={15} />
              WhatsApp
            </button>

            <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Interactive Store Name & Payment Method Customization Bar (Hidden in Print) */}
        <div
          className="no-print"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 0.9fr',
            gap: 12,
            padding: '10px 24px',
            background: 'var(--brand-emerald-light)',
            borderBottom: '1px solid var(--border-brand)',
            alignItems: 'center'
          }}
        >
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--brand-emerald-dark)',
                marginBottom: 3
              }}
            >
              <Store size={13} />
              Store Name on Bill (Editable):
            </label>
            <input
              type="text"
              className="input-field"
              value={billStoreName}
              onChange={(e) => handleStoreNameChange(e.target.value)}
              placeholder="Enter Store Name..."
              style={{ height: 32, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700 }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--brand-emerald-dark)',
                marginBottom: 3
              }}
            >
              <CreditCard size={13} />
              Payment Method on Bill:
            </label>
            <select
              className="input-field"
              value={selectedPaymentMode}
              onChange={(e) => handlePaymentModeChange(e.target.value as PaymentMode)}
              style={{ height: 32, padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700 }}
            >
              <option value="CASH">CASH (Counter Cash)</option>
              <option value="UPI">UPI (QR / GPay / PhonePe)</option>
              <option value="CARD">CARD (Debit / Credit Card)</option>
              <option value="CREDIT_KHATA">CREDIT (Khata Ledger)</option>
            </select>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--brand-emerald-dark)',
                marginBottom: 3
              }}
            >
              Payment Ref / Txn ID (Optional):
            </label>
            <input
              type="text"
              className="input-field"
              value={paymentRef}
              onChange={(e) => handlePaymentRefChange(e.target.value)}
              placeholder="e.g. UTR / Card Auth #"
              style={{ height: 32, padding: '4px 10px', fontSize: '0.78rem' }}
            />
          </div>
        </div>

        {/* Invoice Body */}
        <div
          className="invoice-paper-wrapper"
          style={{ padding: 24, background: '#ffffff', color: '#0f172a', maxHeight: '72vh', overflowY: 'auto' }}
        >
          {printFormat === 'A4_TAX_INVOICE' ? (
            /* --- A4 Standard Indian GST Tax Invoice --- */
            <div
              className="a4-tax-invoice-sheet"
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                lineHeight: 1.4,
                border: '2px solid #000000',
                padding: 16
              }}
            >
              {/* Header Title */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #000000',
                  paddingBottom: 8,
                  marginBottom: 12
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <BrandLogo variant="horizontal" size="sm" />
                  <div style={{ borderLeft: '2px solid #166B50', paddingLeft: 12 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#166B50', lineHeight: 1.1 }}>
                      {billStoreName}
                    </div>
                    {activeBranchName && (
                      <div style={{ fontSize: '10px', color: '#475569', fontWeight: 600 }}>
                        Outlet: {activeBranchName}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2
                    style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      margin: 0,
                      color: '#166B50'
                    }}
                  >
                    TAX INVOICE
                  </h2>
                  <div style={{ fontSize: '10px', color: '#475569' }}>
                    (Issued under Section 31 of Central Goods and Services Tax Act, 2017)
                  </div>
                </div>
              </div>

              {/* Supplier & Invoice Details 2-Column */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: 16,
                  borderBottom: '1px solid #000000',
                  paddingBottom: 12,
                  marginBottom: 12
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#475569', fontWeight: 'bold' }}>
                    Sold By / Store Details:
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '2px 0 3px 0', color: '#0f172a' }}>
                    {billStoreName}
                  </h3>
                  {tenant.name && tenant.name !== billStoreName && (
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#334155' }}>
                      Legal Entity: {tenant.name}
                    </div>
                  )}
                  <div>
                    {tenant.address.street}, {tenant.address.city} - {tenant.address.pincode}
                  </div>
                  <div>
                    State: <strong>{tenant.address.state} (Code: {tenant.stateCode})</strong>
                  </div>
                  <div>
                    GSTIN: <strong>{tenant.gstin}</strong> | PAN: <strong>{tenant.pan}</strong>
                  </div>
                  <div>
                    Phone: {tenant.phone} | Email: {tenant.email}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 10, border: '1px solid #cbd5e1', borderRadius: 4 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '115px 1fr', gap: 4 }}>
                    <strong>Store Name:</strong>
                    <span style={{ fontWeight: 'bold', color: '#166B50' }}>{billStoreName}</span>

                    <strong>Invoice No:</strong>
                    <span style={{ fontWeight: 'bold' }}>{invoice.invoiceNumber}</span>

                    <strong>Invoice Date:</strong>
                    <span>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>

                    <strong>Place of Supply:</strong>
                    <span>
                      State Code {invoice.placeOfSupplyStateCode} ({invoice.isInterState ? 'Inter-State' : 'Intra-State'})
                    </span>

                    <strong>Payment Method:</strong>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: '#0f172a',
                        background: '#dcfce7',
                        border: '1px solid #86efac',
                        padding: '1px 6px',
                        borderRadius: 4,
                        display: 'inline-block',
                        width: 'fit-content'
                      }}
                    >
                      {formatPaymentModeLabel(selectedPaymentMode)}
                      {paymentRef ? ` (${paymentRef})` : ''}
                    </span>

                    <strong>Payment Status:</strong>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: effectiveBalanceAmount === 0 ? '#059669' : '#d97706'
                      }}
                    >
                      {effectivePaymentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buyer Details */}
              <div style={{ borderBottom: '1px solid #000000', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 4 }}>
                  Details of Receiver (Billed To):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div>
                      Name: <strong>{invoice.customerName}</strong>
                    </div>
                    <div>Phone: {invoice.customerPhone || 'N/A'}</div>
                  </div>
                  <div>
                    <div>
                      GSTIN: <strong>{invoice.customerGstin || 'URP (Unregistered Person)'}</strong>
                    </div>
                    <div>
                      State Code: <strong>{invoice.customerStateCode || tenant.stateCode}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: '10px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
                    <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>#</th>
                    <th style={{ padding: '6px 4px', textAlign: 'left', borderRight: '1px solid #cbd5e1' }}>
                      Item Description
                    </th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>HSN/SAC</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>Qty</th>
                    <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>Rate (₹)</th>
                    <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                      Taxable Val
                    </th>
                    {!invoice.isInterState ? (
                      <>
                        <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>CGST</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>SGST</th>
                      </>
                    ) : (
                      <th style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>IGST</th>
                    )}
                    <th style={{ padding: '6px 4px', textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '6px 4px', borderRight: '1px solid #cbd5e1' }}>
                        <strong>{item.name}</strong>
                        <div style={{ fontSize: '9px', color: '#64748b' }}>SKU: {item.sku}</div>
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                        {item.hsnCode}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'center', borderRight: '1px solid #cbd5e1' }}>
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                        ₹{item.unitPrice}
                      </td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                        ₹{item.taxableAmount}
                      </td>
                      {!invoice.isInterState ? (
                        <>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                            {item.cgstRate}% (₹{item.cgstAmount})
                          </td>
                          <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                            {item.sgstRate}% (₹{item.sgstAmount})
                          </td>
                        </>
                      ) : (
                        <td style={{ padding: '6px 4px', textAlign: 'right', borderRight: '1px solid #cbd5e1' }}>
                          {item.igstRate}% (₹{item.igstAmount})
                        </td>
                      )}
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>₹{item.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: 16,
                  borderTop: '1px solid #000000',
                  paddingTop: 8
                }}
              >
                <div>
                  {/* Payment Settlement Summary Box on A4 Invoice */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: 4,
                      padding: 8,
                      marginBottom: 8
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#166B50', marginBottom: 3 }}>
                      Payment Settlement Details:
                    </div>
                    <div>
                      Payment Mode: <strong>{formatPaymentModeLabel(selectedPaymentMode)}</strong>
                    </div>
                    {paymentRef && (
                      <div>
                        Reference / Txn No: <strong>{paymentRef}</strong>
                      </div>
                    )}
                    <div>
                      Amount Received: <strong>₹{effectivePaidAmount.toLocaleString('en-IN')}</strong>
                      {effectiveBalanceAmount > 0 && (
                        <span style={{ color: '#dc2626', marginLeft: 8 }}>
                          (Balance Due: ₹{effectiveBalanceAmount.toLocaleString('en-IN')})
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <strong>Bank Details for NEFT/RTGS:</strong>
                    <div>Bank: HDFC Bank Ltd | A/C: 50200012345678</div>
                    <div>IFSC: HDFC0001234 | Branch: Shivaji Nagar, Pune</div>
                    <div>
                      UPI ID: <strong>apexretail@okaxis</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: 6 }}>
                    <strong>Terms &amp; Conditions:</strong>
                    <br />
                    {tenant.termsAndConditions}
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid #cbd5e1', paddingLeft: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, fontSize: '11px' }}>
                    <div>Total Taxable Value:</div>
                    <div style={{ textAlign: 'right' }}>₹{invoice.taxableAmount.toLocaleString('en-IN')}</div>

                    {!invoice.isInterState ? (
                      <>
                        <div>Total CGST:</div>
                        <div style={{ textAlign: 'right' }}>₹{invoice.totalCgst.toLocaleString('en-IN')}</div>
                        <div>Total SGST:</div>
                        <div style={{ textAlign: 'right' }}>₹{invoice.totalSgst.toLocaleString('en-IN')}</div>
                      </>
                    ) : (
                      <>
                        <div>Total IGST:</div>
                        <div style={{ textAlign: 'right' }}>₹{invoice.totalIgst.toLocaleString('en-IN')}</div>
                      </>
                    )}

                    {invoice.roundOff !== 0 && (
                      <>
                        <div>Round Off:</div>
                        <div style={{ textAlign: 'right' }}>₹{invoice.roundOff}</div>
                      </>
                    )}

                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '13px',
                        borderTop: '1px solid #000000',
                        paddingTop: 4
                      }}
                    >
                      Grand Total:
                    </div>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '13px',
                        textAlign: 'right',
                        borderTop: '1px solid #000000',
                        paddingTop: 4
                      }}
                    >
                      ₹{invoice.grandTotal.toLocaleString('en-IN')}
                    </div>

                    <div style={{ color: '#475569', fontSize: '10px' }}>Payment Method:</div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '10px', color: '#166B50' }}>
                      {formatPaymentModeLabel(selectedPaymentMode)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: 22, fontSize: '10px' }}>
                    <div>
                      For <strong>{billStoreName}</strong>
                    </div>
                    <div style={{ height: 36 }}></div>
                    <div>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- 80mm POS Thermal Slip Format --- */
            <div
              className="thermal-receipt-sheet"
              style={{
                width: 320,
                margin: '0 auto',
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: '11px',
                padding: 12,
                border: '1px dashed #94a3b8',
                lineHeight: 1.35
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{ marginBottom: 4, display: 'flex', justifyContent: 'center' }}>
                  <BrandLogo variant="mark" size="sm" />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0', textTransform: 'uppercase' }}>
                  {billStoreName}
                </h3>
                {activeBranchName && <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{activeBranchName}</div>}
                <div>
                  {tenant.address.city} - {tenant.address.pincode}
                </div>
                <div>GSTIN: {tenant.gstin}</div>
                <div>Ph: {tenant.phone}</div>
                <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>
                <div style={{ fontWeight: 'bold' }}>TAX INVOICE / POS RECEIPT</div>
                <div>Bill No: {invoice.invoiceNumber}</div>
                <div>Date: {new Date(invoice.createdAt).toLocaleString('en-IN')}</div>
                <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>
              </div>

              <div>
                Customer: <strong>{invoice.customerName}</strong>
              </div>
              <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>

              <table style={{ width: '100%', fontSize: '10px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Item</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map(it => (
                    <tr key={it.id}>
                      <td style={{ textAlign: 'left' }}>{it.name}</td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>₹{it.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                <span>NET TOTAL:</span>
                <span>₹{invoice.grandTotal.toLocaleString('en-IN')}</span>
              </div>

              <div style={{ fontSize: '10px', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Taxable Amt: ₹{invoice.taxableAmount}</span>
                  <span>GST: ₹{invoice.totalTax}</span>
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed #000000', margin: '6px 0' }}></div>

              {/* Prominent Payment Method Block on Thermal Receipt */}
              <div style={{ fontSize: '10.5px', lineHeight: 1.4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>PAYMENT METHOD:</span>
                  <span>{formatPaymentModeLabel(selectedPaymentMode)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PAYMENT STATUS:</span>
                  <strong>{effectivePaymentStatus}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PAID AMOUNT:</span>
                  <span>₹{effectivePaidAmount.toLocaleString('en-IN')}</span>
                </div>
                {effectiveBalanceAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>BALANCE DUE:</span>
                    <span>₹{effectiveBalanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {paymentRef && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>REF NO:</span>
                    <span>{paymentRef}</span>
                  </div>
                )}
              </div>

              <div style={{ borderBottom: '1px dashed #000000', margin: '8px 0' }}></div>

              <div style={{ textAlign: 'center', fontSize: '10px' }}>
                *** THANK YOU FOR SHOPPING AT {billStoreName.toUpperCase()} ***
                <br />
                Powered by InvoDesk
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
