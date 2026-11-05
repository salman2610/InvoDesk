'use client';

import React from 'react';
import {
  Zap,
  LayoutDashboard,
  Package,
  FileText,
  Users,
  Building2,
  RefreshCw,
  Wifi,
  WifiOff,
  PieChart,
  Sun,
  Moon,
  Settings as SettingsIcon,
  UserCheck,
  Store,
  Edit3,
  Download
} from 'lucide-react';
import { Branch } from '@invodesk/types';
import { BrandLogo } from './BrandLogo';

export type ActiveTab = 'pos' | 'dashboard' | 'inventory' | 'invoices' | 'customers' | 'gstr1' | 'sync';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  storeName?: string;
  branches: Branch[];
  activeBranch: Branch | null;
  setActiveBranch: (branch: Branch) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  pendingSyncCount: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onOpenSettings?: () => void;
  onOpenStoreSettings?: () => void;
  onOpenLogin?: () => void;
  currentUser?: { name: string; role: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storeName = 'Apex Supermart',
  branches,
  activeBranch,
  setActiveBranch,
  isOnline,
  setIsOnline,
  pendingSyncCount,
  theme = 'light',
  onToggleTheme,
  onOpenSettings,
  onOpenStoreSettings,
  onOpenLogin,
  currentUser = { name: 'Cashier T1', role: 'CASHIER' }
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className="glass-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '8px 20px',
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
      }}
    >
      {/* Left: Single Prominent Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={() => setActiveTab('pos')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title="InvoDesk - Return to POS Counter"
        >
          <BrandLogo variant={isDark ? 'dark' : 'horizontal'} height={44} width={196} isDark={isDark} />
        </button>
      </div>

      {/* Center: Navigation Tabs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-tertiary)',
          padding: 3,
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          gap: 2,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          minWidth: 0
        }}
      >
        <button
          onClick={() => setActiveTab('pos')}
          className={`btn btn-sm ${activeTab === 'pos' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <Zap size={14} />
          <span>POS Counter</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`btn btn-sm ${activeTab === 'dashboard' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <LayoutDashboard size={14} />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <Package size={14} />
          <span>Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`btn btn-sm ${activeTab === 'invoices' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <FileText size={14} />
          <span>Invoices</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`btn btn-sm ${activeTab === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <Users size={14} />
          <span>Customers</span>
        </button>

        <button
          onClick={() => setActiveTab('gstr1')}
          className={`btn btn-sm ${activeTab === 'gstr1' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', whiteSpace: 'nowrap' }}
        >
          <PieChart size={14} />
          <span>GSTR-1</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`btn btn-sm ${activeTab === 'sync' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ borderRadius: 'var(--radius-md)', padding: '6px 11px', position: 'relative', whiteSpace: 'nowrap' }}
        >
          <RefreshCw size={13} className={pendingSyncCount > 0 ? 'animate-spin' : ''} />
          <span>Sync</span>
          {pendingSyncCount > 0 && (
            <span
              style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                borderRadius: 10,
                padding: '1px 6px',
                fontWeight: 800,
                marginLeft: 2
              }}
            >
              {pendingSyncCount}
            </span>
          )}
        </button>
      </nav>

      {/* Right Controls: Store Name + Branch Switcher, Network Mode, Theme, Settings, Shift */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {/* Store Name & Branch Selector Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-secondary)',
            padding: '4px 8px',
            borderRadius: 8,
            border: '1px solid var(--border-subtle)',
            fontSize: '0.76rem'
          }}
        >
          <button
            onClick={onOpenStoreSettings || onOpenSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--brand-emerald-light)',
              color: 'var(--brand-emerald-dark)',
              border: '1px solid var(--border-brand)',
              borderRadius: 6,
              padding: '3px 7px',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Click to edit Store Name on UI & Bill"
          >
            <Store size={13} />
            <span style={{ maxWidth: 115, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {storeName}
            </span>
            <Edit3 size={11} />
          </button>

          {branches.length > 0 && (
            <select
              value={activeBranch?.id || ''}
              onChange={(e) => {
                const b = branches.find(item => item.id === e.target.value);
                if (b) setActiveBranch(b);
              }}
              style={{
                background: 'transparent',
                color: 'var(--text-main)',
                border: 'none',
                outline: 'none',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                maxWidth: 120
              }}
              title="Switch Active Store Branch / Outlet"
            >
              {branches.map(b => (
                <option key={b.id} value={b.id} style={{ background: 'var(--bg-card)' }}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Offline / Online Network Simulation Toggle */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          title="Toggle Network Online/Offline state to test offline synchronization"
          className="btn btn-sm"
          style={{
            background: isOnline ? 'var(--brand-emerald-light)' : 'rgba(239, 68, 68, 0.12)',
            color: isOnline ? 'var(--brand-emerald-dark)' : '#DC2626',
            border: isOnline ? '1px solid var(--border-brand)' : '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: '0.8rem'
          }}
        >
          {isOnline ? (
            <>
              <Wifi size={14} />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff size={14} />
              <span>Offline</span>
            </>
          )}
        </button>

        {/* Link to 7-Day Free Pass Landing & App Downloads */}
        <a
          href="/"
          className="btn btn-outline btn-sm"
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: '0.76rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            borderColor: 'var(--brand-accent)',
            color: 'var(--brand-emerald-dark)',
            background: 'var(--brand-emerald-light)'
          }}
          title="Download Desktop App & Claim 7-Day Free Pass"
        >
          <Download size={13} color="var(--brand-accent)" />
          <span>7-Day Free Pass</span>
        </a>

        {/* Theme Toggle (Light / Dark) */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="btn btn-outline btn-sm"
            style={{ padding: '7px 9px', borderRadius: 8 }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={15} color="#22C55E" /> : <Moon size={15} color="#166B50" />}
          </button>
        )}

        {/* Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="btn btn-outline btn-sm"
            style={{ padding: '7px 9px', borderRadius: 8 }}
            title="Store & System Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={15} color="var(--text-secondary)" />
          </button>
        )}

        {/* Operator / Login Shift Button */}
        {onOpenLogin && (
          <button
            onClick={onOpenLogin}
            className="btn btn-outline btn-sm"
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: 5
            }}
            title="Switch Cashier Shift / Operator"
          >
            <UserCheck size={14} color="var(--brand-emerald-dark)" />
            <span style={{ fontWeight: 600 }}>{currentUser.name.split(' ')[0]}</span>
          </button>
        )}
      </div>
    </header>
  );
};
