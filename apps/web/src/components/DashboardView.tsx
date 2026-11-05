'use client';

import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Package,
  AlertTriangle,
  FileText,
  Users,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Clock
} from 'lucide-react';
import { BusinessDashboardStats, Invoice, Product } from '@invodesk/types';

interface DashboardViewProps {
  stats: BusinessDashboardStats;
  products: Product[];
  invoices: Invoice[];
  onOpenInvoiceModal: (invoice: Invoice) => void;
  onNavigateTab: (tab: 'pos' | 'inventory' | 'invoices' | 'customers' | 'gstr1') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  products,
  invoices,
  onOpenInvoiceModal,
  onNavigateTab
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Welcome & KPI Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}>
            Executive Business Dashboard
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Real-time business performance, billing velocity, and tax monitoring
          </p>
        </div>

        <button
          onClick={() => onNavigateTab('pos')}
          className="btn btn-primary"
          style={{ padding: '10px 18px' }}
        >
          <Sparkles size={16} />
          Launch Counter POS
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {/* Today's Sales */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Today's Sales
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399'
            }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
            ₹{stats.todaySales.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#34d399' }}>
            <TrendingUp size={14} />
            <span>{stats.todaySalesCount} invoices billed today</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Monthly Revenue
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'var(--brand-emerald-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-emerald)'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
            ₹{stats.monthRevenue.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--brand-emerald)' }}>
            <span>+14.8% vs last month</span>
          </div>
        </div>

        {/* Total Receivables (Khata Ledger) */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Pending Receivables (Khata)
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginBottom: 4 }}>
            ₹{stats.totalReceivables.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Uncollected credit sales
          </div>
        </div>

        {/* Inventory Valuation & Alerts */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Inventory Valuation
            </span>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee'
            }}>
              <Package size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>
            ₹{stats.inventoryValuation.toLocaleString('en-IN')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}>
            {stats.lowStockItemsCount > 0 ? (
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={13} />
                {stats.lowStockItemsCount} items at low stock
              </span>
            ) : (
              <span style={{ color: '#34d399' }}>Healthy stock levels</span>
            )}
          </div>
        </div>
      </div>

      {/* Middle Grid: Top Products Matrix & Recent Invoices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top Selling Products */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingBag size={18} color="var(--accent-primary)" />
              Top Selling Products
            </h3>
            <button onClick={() => onNavigateTab('inventory')} className="btn btn-outline btn-sm">
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.topSellingProducts.length > 0 ? (
              stats.topSellingProducts.map((p, idx) => (
                <div
                  key={p.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--brand-emerald-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--brand-emerald)'
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Sold: {p.quantitySold} units
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-emerald)' }}>
                    ₹{p.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                No sales recorded yet. Create an invoice in POS!
              </div>
            )}
          </div>
        </div>

        {/* Live Sales & Recent Invoices */}
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--brand-emerald)" />
              Recent Invoices & Transactions
            </h3>
            <button onClick={() => onNavigateTab('invoices')} className="btn btn-outline btn-sm">
              Sales Register
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {invoices.slice(0, 5).map(inv => (
              <div
                key={inv.id}
                onClick={() => onOpenInvoiceModal(inv)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inv.invoiceNumber}</span>
                    <span className={`badge ${inv.paymentStatus === 'PAID' ? 'badge-success' : 'badge-warning'}`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {inv.customerName} • {new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ₹{inv.grandTotal.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--brand-emerald)' }}>
                    View GST Slip →
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
