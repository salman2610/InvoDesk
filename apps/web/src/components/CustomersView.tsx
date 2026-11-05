'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  BookOpen,
  Phone,
  Building,
  CheckCircle2,
  X,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Customer } from '@invodesk/types';
import { EmptyState } from './StatusStates';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customer: Partial<Customer>) => void;
  onRecordPayment: (customerId: string, amount: number, mode: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onRecordPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustModalOpen, setNewCustModalOpen] = useState(false);
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedCustForSettle, setSelectedCustForSettle] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleMode, setSettleMode] = useState<string>('UPI');

  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    gstin: '',
    creditLimit: 50000,
    currentBalance: 0
  });

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.gstin && c.gstin.toLowerCase().includes(q))
      );
    });
  }, [customers, searchTerm]);

  const handleOpenSettle = (c: Customer) => {
    setSelectedCustForSettle(c);
    setSettleAmount(c.currentBalance.toString());
    setSettleModalOpen(true);
  };

  const handleSaveSettle = () => {
    if (!selectedCustForSettle) return;
    const amt = parseFloat(settleAmount);
    if (isNaN(amt) || amt <= 0) return;
    onRecordPayment(selectedCustForSettle.id, amt, settleMode);
    setSettleModalOpen(false);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.phone) return;
    onAddCustomer(newCustomer);
    setNewCustModalOpen(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      gstin: '',
      creditLimit: 50000,
      currentBalance: 0
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800 }}>
            Customer Directory & Khata Ledger
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Manage retail customers, B2B party GSTINs, credit limits, and credit payment settlements
          </p>
        </div>

        <button onClick={() => setNewCustModalOpen(true)} className="btn btn-primary">
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search customer name, phone number, GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ paddingLeft: 38 }}
          />
        </div>
      </div>

      {/* Customer Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="search"
          title="No matching customers found"
          description="No customer profiles match your search query. Add a new customer or clear your search filter."
          actionText="Add Customer"
          onAction={() => setNewCustModalOpen(true)}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16
        }}>
          {filtered.map(c => {
            const hasBalance = c.currentBalance > 0;

            return (
              <div
                key={c.id}
                className="glass-panel"
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {c.name}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        <Phone size={12} />
                        <span>{c.phone}</span>
                      </div>
                    </div>

                    <span className={`badge ${c.gstin ? 'badge-indigo' : 'badge-success'}`}>
                      {c.gstin ? 'B2B Client' : 'Retail'}
                    </span>
                  </div>

                  {c.gstin && (
                    <div style={{
                      fontSize: '0.75rem',
                      background: 'var(--brand-emerald-light)',
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border-brand)',
                      marginBottom: 10
                    }}>
                      GSTIN: <strong style={{ color: 'var(--brand-emerald-dark)' }}>{c.gstin}</strong>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                        State: {c.billingAddress?.state} ({c.billingAddress?.stateCode})
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Balances */}
                <div style={{
                  background: 'var(--bg-tertiary)',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Khata Outstanding</div>
                    <div style={{
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      color: hasBalance ? 'var(--accent-warning)' : 'var(--brand-emerald-dark)'
                    }}>
                      ₹{c.currentBalance.toLocaleString('en-IN')}
                    </div>
                  </div>

                  {hasBalance && (
                    <button
                      onClick={() => handleOpenSettle(c)}
                      className="btn btn-sm btn-success"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Banknote size={14} />
                      Collect Khata
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settle Khata Payment Modal */}
      {settleModalOpen && selectedCustForSettle && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 440, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Record Khata Settlement</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Customer: {selectedCustForSettle.name}
                </p>
              </div>
              <button onClick={() => setSettleModalOpen(false)} className="btn btn-outline btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Payment Amount Collected (₹)
                </label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 5000"
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Payment Mode
                </label>
                <select
                  value={settleMode}
                  onChange={(e) => setSettleMode(e.target.value)}
                  className="input-field"
                >
                  <option value="UPI">UPI / QR Transfer</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="NET_BANKING">Direct Bank Transfer</option>
                </select>
              </div>

              <button onClick={handleSaveSettle} className="btn btn-success" style={{ marginTop: 8 }}>
                <CheckCircle2 size={16} />
                Record & Update Khata Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {newCustModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: 480, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Customer Profile</h3>
              <button onClick={() => setNewCustModalOpen(false)} className="btn btn-outline btn-sm" style={{ padding: 6, borderRadius: '50%' }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Full Name / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma or Priya Enterprises"
                  value={newCustomer.name}
                  onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9822011223"
                    value={newCustomer.phone}
                    onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>GSTIN (Optional for B2B)</label>
                  <input
                    type="text"
                    placeholder="e.g. 27ABCDE1234F1Z5"
                    value={newCustomer.gstin}
                    onChange={e => setNewCustomer({ ...newCustomer, gstin: e.target.value.toUpperCase() })}
                    className="input-field"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={newCustomer.creditLimit}
                    onChange={e => setNewCustomer({ ...newCustomer, creditLimit: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Opening Balance (₹)</label>
                  <input
                    type="number"
                    value={newCustomer.currentBalance}
                    onChange={e => setNewCustomer({ ...newCustomer, currentBalance: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>
                <CheckCircle2 size={16} />
                Save Customer
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
