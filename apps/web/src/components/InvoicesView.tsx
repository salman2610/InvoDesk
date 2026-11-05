'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Share2,
  Eye,
  Store,
  CreditCard
} from 'lucide-react';
import { Invoice } from '@invodesk/types';
import { buildWhatsAppShareUrl } from '@invodesk/billing';
import { EmptyState } from './StatusStates';

interface InvoicesViewProps {
  invoices: Invoice[];
  businessName: string;
  onOpenInvoiceModal: (invoice: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  businessName,
  onOpenInvoiceModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customerPhone && inv.customerPhone.includes(searchTerm));
      const matchStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
            Sales Register &amp; Tax Invoices
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Complete audit trail of sales transactions, GST tax breakdowns, and settlement receipts for{' '}
            <strong style={{ color: 'var(--brand-emerald-dark)' }}>{businessName}</strong>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Invoice #, Customer name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description="No tax invoices match your search query or filter. Create a sale at the POS counter to generate an invoice."
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice # &amp; Date</th>
                  <th>Store Name</th>
                  <th>Customer</th>
                  <th>Type / Supply</th>
                  <th>Items</th>
                  <th>Grand Total</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const payMode =
                    inv.payments?.[0]?.mode ||
                    (inv.paymentStatus === 'UNPAID' ? 'CREDIT_KHATA' : 'CASH');
                  const payRef = inv.payments?.[0]?.referenceNumber;

                  return (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--brand-emerald-dark)' }}>
                          {inv.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}{' '}
                          • {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 700, fontSize: '0.82rem' }}>
                          <Store size={13} color="var(--brand-emerald-dark)" />
                          <span>{businessName}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.customerName}</div>
                        {inv.customerGstin && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            GSTIN: {inv.customerGstin}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${inv.isInterState ? 'badge-warning' : 'badge-indigo'}`}>
                          {inv.isInterState ? 'Inter-State' : 'Intra-State'}
                        </span>
                      </td>
                      <td>{inv.items.length} items</td>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--brand-emerald-dark)' }}>
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </strong>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          GST: ₹{inv.totalTax.toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            payMode === 'CREDIT_KHATA' ? 'badge-warning' : 'badge-success'
                          }`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <CreditCard size={11} />
                          {payMode === 'CREDIT_KHATA' ? 'CREDIT (KHATA)' : payMode}
                        </span>
                        {payRef && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            Ref: {payRef}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => onOpenInvoiceModal(inv)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            title="View / Print Tax Invoice"
                          >
                            <Eye size={13} />
                            View Slip
                          </button>

                          <button
                            onClick={() => {
                              const url = buildWhatsAppShareUrl(inv, businessName);
                              window.open(url, '_blank');
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', color: 'var(--brand-emerald-dark)' }}
                            title="Share on WhatsApp"
                          >
                            <Share2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
