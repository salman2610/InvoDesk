'use client';

import React from 'react';
import { AlertTriangle, AlertCircle, RefreshCw, Inbox, PackageX, SearchX, CheckCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

// 1. Loading Screen Component
export interface LoadingScreenProps {
  message?: string;
  isDark?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Initializing InvoDesk POS Engine & Hardware...',
  isDark = false
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      minHeight: '400px',
      textAlign: 'center'
    }}>
      <div style={{ marginBottom: 20 }}>
        <BrandLogo variant={isDark ? 'dark' : 'horizontal'} size="lg" isDark={isDark} />
      </div>

      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 20px',
        borderRadius: 9999,
        background: 'var(--brand-emerald-light)',
        border: '1px solid var(--border-brand)',
        color: 'var(--brand-emerald)',
        fontSize: '0.875rem',
        fontWeight: 600
      }}>
        <RefreshCw size={16} className="animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
};

// 2. Empty State Component
export interface EmptyStateProps {
  icon?: 'search' | 'package' | 'inbox' | 'alert';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction
}) => {
  const IconComponent = {
    search: SearchX,
    package: PackageX,
    inbox: Inbox,
    alert: AlertCircle
  }[icon];

  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: '1px dashed var(--border-subtle)',
      margin: '16px 0'
    }}>
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        background: 'var(--brand-emerald-light)',
        border: '1px solid var(--border-brand)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--brand-emerald)',
        marginBottom: 16
      }}>
        <IconComponent size={26} />
      </div>

      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: 420, lineHeight: 1.5, marginBottom: actionText ? 16 : 0 }}>
        {description}
      </p>

      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};

// 3. Error Banner Component
export interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isDark?: boolean;
}

export const ErrorState: React.FC<ErrorPageProps> = ({
  title = 'Hardware or Network Exception',
  message = 'An unexpected exception occurred while contacting the database engine or peripheral hardware.',
  onRetry,
  isDark = false
}) => {
  return (
    <div style={{
      padding: '40px 24px',
      textAlign: 'center',
      maxWidth: 540,
      margin: '40px auto',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid rgba(220, 38, 38, 0.25)',
      boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        background: 'rgba(220, 38, 38, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--accent-danger)',
        margin: '0 auto 16px'
      }}>
        <AlertTriangle size={30} />
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
        {message}
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary btn-sm">
            <RefreshCw size={15} /> Retry Operation
          </button>
        )}
        <button onClick={() => window.location.reload()} className="btn btn-outline btn-sm">
          Reload Application
        </button>
      </div>
    </div>
  );
};
