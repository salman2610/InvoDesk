'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Moon,
  Sun,
  Monitor,
  Shield,
  Printer,
  Database,
  CheckCircle2,
  Store,
  Plus,
  Building2
} from 'lucide-react';
import { Branch, BusinessTenant } from '@invodesk/types';
import { BrandLogo } from './BrandLogo';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  tenant?: BusinessTenant;
  onUpdateTenant?: (updated: Partial<BusinessTenant>) => void;
  branches?: Branch[];
  activeBranch?: Branch;
  onUpdateBranch?: (branchId: string, updated: Partial<Branch>) => void;
  onAddBranch?: (newBranch: { name: string; code: string; city?: string; phone?: string; gstin?: string }) => void;
  initialSubTab?: 'store' | 'general' | 'hardware' | 'tax' | 'brand';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  tenant,
  onUpdateTenant,
  branches = [],
  activeBranch,
  onUpdateBranch,
  onAddBranch,
  initialSubTab = 'store'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'store' | 'general' | 'hardware' | 'tax' | 'brand'>(initialSubTab);

  // Store & Tenant Editable Fields
  const [storeDisplayName, setStoreDisplayName] = useState(tenant?.tradeName || tenant?.name || 'Apex Supermart');
  const [legalBusinessName, setLegalBusinessName] = useState(tenant?.name || 'Apex Retailers & Supermart Pvt Ltd');
  const [storeGstin, setStoreGstin] = useState(tenant?.gstin || '27AAACA1234A1Z5');
  const [storePhone, setStorePhone] = useState(tenant?.phone || '+91 98220 12345');
  const [storeEmail, setStoreEmail] = useState(tenant?.email || 'accounts@apexretail.in');
  const [storeStreet, setStoreStreet] = useState(tenant?.address?.street || 'Plot 42, Senapati Bapat Marg, Shivaji Nagar');
  const [storeCity, setStoreCity] = useState(tenant?.address?.city || 'Pune');
  const [storePincode, setStorePincode] = useState(tenant?.address?.pincode || '411016');
  const [storeTerms, setStoreTerms] = useState(
    tenant?.termsAndConditions || '1. Goods once sold will not be taken back.\n2. Warranty as per manufacturer terms.'
  );

  // Active Branch / Outlet Editable Fields
  const [branchName, setBranchName] = useState(activeBranch?.name || 'Apex Flagship Store - Pune');
  const [branchCode, setBranchCode] = useState(activeBranch?.code || 'PUN-01');

  // Add New Store Branch Fields
  const [showAddBranchForm, setShowAddBranchForm] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('Pune');

  const [currencySymbol, setCurrencySymbol] = useState('₹ (INR)');
  const [autoBackup, setAutoBackup] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [printerPaper, setPrinterPaper] = useState('80mm');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveSubTab(initialSubTab);
    }
  }, [isOpen, initialSubTab]);

  useEffect(() => {
    if (tenant) {
      setStoreDisplayName(tenant.tradeName || tenant.name || '');
      setLegalBusinessName(tenant.name || '');
      setStoreGstin(tenant.gstin || '');
      setStorePhone(tenant.phone || '');
      setStoreEmail(tenant.email || '');
      setStoreStreet(tenant.address?.street || '');
      setStoreCity(tenant.address?.city || '');
      setStorePincode(tenant.address?.pincode || '');
      setStoreTerms(tenant.termsAndConditions || '');
    }
  }, [tenant]);

  useEffect(() => {
    if (activeBranch) {
      setBranchName(activeBranch.name || '');
      setBranchCode(activeBranch.code || '');
    }
  }, [activeBranch]);

  if (!isOpen) return null;

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const code = newBranchCode.trim() || `STR-${Math.floor(10 + Math.random() * 90)}`;
    if (onAddBranch) {
      onAddBranch({
        name: newBranchName.trim(),
        code: code.toUpperCase(),
        city: newBranchCity.trim() || storeCity,
        phone: storePhone,
        gstin: storeGstin
      });
    }
    setNewBranchName('');
    setNewBranchCode('');
    setShowAddBranchForm(false);
  };

  const handleSave = () => {
    if (onUpdateTenant) {
      onUpdateTenant({
        tradeName: storeDisplayName.trim() || legalBusinessName.trim(),
        name: legalBusinessName.trim() || storeDisplayName.trim(),
        gstin: storeGstin.trim(),
        phone: storePhone.trim(),
        email: storeEmail.trim(),
        termsAndConditions: storeTerms,
        address: {
          street: storeStreet.trim(),
          city: storeCity.trim(),
          state: tenant?.address?.state || 'Maharashtra',
          stateCode: tenant?.address?.stateCode || tenant?.stateCode || '27',
          pincode: storePincode.trim(),
          country: 'India'
        }
      });
    }

    if (activeBranch && onUpdateBranch && branchName.trim()) {
      onUpdateBranch(activeBranch.id, {
        name: branchName.trim(),
        code: branchCode.trim() || activeBranch.code
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 700);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ width: '100%', maxWidth: 720, padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--brand-emerald-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-brand)'
              }}
            >
              <Settings size={20} color="var(--brand-emerald)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Store Profile &amp; POS Settings
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                Configure Store Name on UI &amp; Bills, Outlets, Themes &amp; Hardware
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost"
            style={{ padding: 6, borderRadius: '50%' }}
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subtabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
            padding: '0 24px',
            gap: 16,
            overflowX: 'auto'
          }}
        >
          {[
            { id: 'store', label: 'Store & Bill Name', icon: Store },
            { id: 'general', label: 'Theme & General', icon: Monitor },
            { id: 'hardware', label: 'POS Hardware', icon: Printer },
            { id: 'tax', label: 'GST & Compliance', icon: Shield },
            { id: 'brand', label: 'Brand Identity', icon: Database }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                style={{
                  padding: '12px 6px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? 'var(--brand-emerald)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  borderBottom: isActive ? '2px solid var(--brand-emerald)' : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px', maxHeight: '64vh', overflowY: 'auto' }}>
          {activeSubTab === 'store' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Store Name on UI & Bill */}
              <div
                style={{
                  background: 'var(--brand-emerald-light)',
                  border: '1px solid var(--border-brand)',
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Store size={18} color="var(--brand-emerald-dark)" />
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Store Name (Displayed on UI Header, A4 Tax Invoice &amp; Thermal Receipt)
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                      Store Display / Trade Name *
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Apex Supermart"
                      value={storeDisplayName}
                      onChange={(e) => setStoreDisplayName(e.target.value)}
                      style={{ fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                      Legal Registered Business Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Apex Retailers & Supermart Pvt Ltd"
                      value={legalBusinessName}
                      onChange={(e) => setLegalBusinessName(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Active Store Outlet / Branch & Add New Store */}
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={17} color="var(--brand-emerald-dark)" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      Active Store Outlet / Branch ({branches.length} {branches.length === 1 ? 'Store' : 'Stores'})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddBranchForm(!showAddBranchForm)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    <Plus size={14} />
                    {showAddBranchForm ? 'Cancel' : 'Add Another Store'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Current Outlet / Counter Name
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Main Counter - MG Road"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                      Invoice Prefix Code
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      value={branchCode}
                      onChange={(e) => setBranchCode(e.target.value)}
                      placeholder="PUN-01"
                    />
                  </div>
                </div>

                {showAddBranchForm && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: '1px dashed var(--border-subtle)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 110px 120px auto',
                      gap: 8,
                      alignItems: 'end'
                    }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>
                        New Store / Branch Name
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Koramangala Store"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>
                        Code
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="BLR-02"
                        value={newBranchCode}
                        onChange={(e) => setNewBranchCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, marginBottom: 4 }}>
                        City
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="City"
                        value={newBranchCity}
                        onChange={(e) => setNewBranchCity(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateBranch}
                      className="btn btn-primary btn-sm"
                      style={{ height: 38, padding: '0 14px' }}
                    >
                      Add Store
                    </button>
                  </div>
                )}
              </div>

              {/* Store Contact, GSTIN & Address for Bill */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    Store GSTIN (Printed on Bill)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={storeGstin}
                    onChange={(e) => setStoreGstin(e.target.value.toUpperCase())}
                    placeholder="27AAACA1234A1Z5"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    Store Phone Number
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    placeholder="+91 98220 12345"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    Store Email
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    placeholder="store@example.com"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 110px', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    Store Street Address
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={storeStreet}
                    onChange={(e) => setStoreStreet(e.target.value)}
                    placeholder="Street / Building / Landmark"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    City
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-main)' }}>
                    Pincode
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={storePincode}
                    onChange={(e) => setStorePincode(e.target.value)}
                    placeholder="411016"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'general' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Theme Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 8, color: 'var(--text-main)' }}>
                  Application Theme
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                  InvoDesk defaults to an optimized light mode for bright retail checkout environments.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      border: theme === 'light' ? '2px solid var(--brand-emerald)' : '1px solid var(--border-subtle)',
                      background: theme === 'light' ? 'var(--brand-emerald-light)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Sun size={24} color="#166B50" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Light Mode (Default)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Clean white surfaces &amp; graphite text
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    style={{
                      padding: '14px',
                      borderRadius: 12,
                      border: theme === 'dark' ? '2px solid var(--brand-accent)' : '1px solid var(--border-subtle)',
                      background: theme === 'dark' ? 'var(--brand-emerald-light)' : 'var(--bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Moon size={24} color="#22C55E" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Dark Mode (Charcoal)
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Deep charcoal with emerald accents
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Currency & Locale */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                  Currency &amp; Decimal Precision
                </label>
                <select
                  className="input-field"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                >
                  <option value="₹ (INR)">₹ (Indian Rupee - INR)</option>
                  <option value="$ (USD)">$ (US Dollar - USD)</option>
                  <option value="€ (EUR)">€ (Euro - EUR)</option>
                </select>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Continuous SQLite WAL Journal &amp; Auto-Backup
                  </span>
                  <input
                    type="checkbox"
                    checked={autoBackup}
                    onChange={(e) => setAutoBackup(e.target.checked)}
                    style={{ accentColor: 'var(--brand-emerald)', width: 18, height: 18 }}
                  />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    Audio Beep on Barcode Scan &amp; Cash Drawer Kick
                  </span>
                  <input
                    type="checkbox"
                    checked={soundAlerts}
                    onChange={(e) => setSoundAlerts(e.target.checked)}
                    style={{ accentColor: 'var(--brand-emerald)', width: 18, height: 18 }}
                  />
                </label>
              </div>
            </div>
          )}

          {activeSubTab === 'hardware' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                  Receipt Paper Width
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {['80mm (Standard POS)', '58mm (Compact Mobile)'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPrinterPaper(p.split(' ')[0])}
                      className={`btn btn-sm ${printerPaper === p.split(' ')[0] ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                  Cash Drawer Kick Pin
                </label>
                <select className="input-field" defaultValue="0">
                  <option value="0">Pin 2 (Standard ESC/POS RJ-11)</option>
                  <option value="1">Pin 5 (Auxiliary Secondary Drawer)</option>
                </select>
              </div>
              <div style={{ background: 'var(--brand-emerald-light)', padding: 12, borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Hardware status: Keyboard-wedge scanner listener is active. Hardware bridge connected.
              </div>
            </div>
          )}

          {activeSubTab === 'tax' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                  GST Compliance Engine Mode
                </label>
                <select className="input-field" defaultValue="regular">
                  <option value="regular">Regular GST Dealer (CGST + SGST / IGST with ITC)</option>
                  <option value="composition">Composition Scheme (Section 10)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                  Default Place of Supply State
                </label>
                <input className="input-field" defaultValue="27 - Maharashtra" readOnly />
              </div>
            </div>
          )}

          {activeSubTab === 'brand' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', textAlign: 'center' }}>
              <div style={{ padding: 16, background: theme === 'dark' ? '#062219' : '#FFFFFF', borderRadius: 16, border: '1px solid var(--border-subtle)', width: '100%' }}>
                <BrandLogo variant={theme === 'dark' ? 'dark' : 'horizontal'} size="lg" isDark={theme === 'dark'} />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Official brand identity extracted from source asset sheet. Primary emerald: <code>#166B50</code>, Accent: <code>#22C55E</code>.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            background: 'var(--bg-tertiary)'
          }}
        >
          <button onClick={onClose} className="btn btn-outline btn-sm">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary btn-sm" style={{ minWidth: 140 }}>
            {savedSuccess ? (
              <>
                <CheckCircle2 size={16} /> Store Saved!
              </>
            ) : (
              'Save Store & Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
