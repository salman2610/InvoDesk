'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  Download,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Monitor,
  Printer,
  Barcode,
  Wifi,
  WifiOff,
  Coins,
  QrCode,
  CreditCard,
  BookOpen,
  ChevronRight,
  Layers,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Smartphone,
  Star,
  HelpCircle,
  Terminal,
  Store,
  RefreshCw,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';

const INDIAN_STATES = [
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '07', name: 'Delhi NCR' },
  { code: '24', name: 'Gujarat' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '19', name: 'West Bengal' },
  { code: '08', name: 'Rajasthan' },
  { code: '03', name: 'Punjab' },
  { code: '32', name: 'Kerala' },
  { code: '23', name: 'Madhya Pradesh' }
];

const RETAIL_CATEGORIES = [
  'Grocery & Supermarket',
  'Mobile & Consumer Electronics',
  'Pharmacy & Healthcare Supplies',
  'Fashion, Textiles & Garments',
  'Hardware, Sanitary & Paints',
  'General Retail & Stationery',
  'Quick Service Cafe & Bakery'
];

const LIVE_ACTIVATION_FEEDS = [
  { store: 'Krishna Supermart', city: 'Pune', action: 'Activated 7-Day Pilot', time: 'Just now' },
  { store: 'Apex Mobile Hub', city: 'Mumbai', action: 'Downloaded Windows 64-bit App', time: '2 mins ago' },
  { store: 'Sanjeevani Pharma', city: 'Nagpur', action: 'Created Khata Account', time: '5 mins ago' },
  { store: 'Vandana Fashion House', city: 'Surat', action: 'Billed 42 Retail Orders', time: '7 mins ago' },
  { store: 'Modern Hardware & Paints', city: 'Bengaluru', action: 'Offline SQLite Synced', time: '11 mins ago' }
];

const MARQUEE_ITEMS = [
  '⚡ 3-Second Counter Checkout',
  '🛡️ True Offline SQLite C-Engine',
  '🇮🇳 GSTR-1 & HSN Auto-Breakdown',
  '💳 NPCI Dynamic UPI QR Codes',
  '🖨️ 80mm & 58mm Thermal ESC/POS',
  '🏢 Multi-Branch PostgreSQL Locks',
  '📦 Zero-Duplicate Idempotent Sync',
  '⚖️ Indian Rupee Rounding Precision',
  '🔐 Strict Multi-Tenant Isolation'
];

export default function LandingPage() {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'linux' | 'other'>('windows');
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedTerminal, setCopiedTerminal] = useState(false);

  // Live Toast Notification
  const [feedIndex, setFeedIndex] = useState(0);
  const [showToast, setShowToast] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    businessName: '',
    tradeName: '',
    category: RETAIL_CATEGORIES[0],
    stateCode: '27',
    ownerName: '',
    email: '',
    phone: '',
    password: ''
  });

  const [formStatus, setFormStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState<{
    token: string;
    tenantId: string;
    businessName: string;
    terminalCode: string;
    trialEndsAt: string;
  } | null>(null);

  // Live Countdown State
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 7,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Interactive Live POS Simulator State
  const [demoItems, setDemoItems] = useState([
    { id: '1', name: 'Daawat Basmati Rice (5kg)', price: 450, qty: 1, gst: 5, sku: '890103045612' },
    { id: '2', name: 'Amul Salted Butter (500g)', price: 280, qty: 2, gst: 12, sku: '890126201005' },
    { id: '3', name: 'boAt Earbuds TWS', price: 1299, qty: 1, gst: 18, sku: '890435200118' }
  ]);
  const [isInterState, setIsInterState] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [scannerLaserActive, setScannerLaserActive] = useState(true);
  const [scanFlashAlert, setScanFlashAlert] = useState<string | null>(null);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'CASH' | 'UPI' | 'CARD' | 'KHATA'>('UPI');

  // Detect user operating system
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes('win')) {
        setDetectedOS('windows');
      } else if (ua.includes('linux')) {
        setDetectedOS('linux');
      } else {
        setDetectedOS('other');
      }
    }
  }, []);

  // Cycle social proof activation toasts
  useEffect(() => {
    const toastInterval = setInterval(() => {
      setShowToast(false);
      setTimeout(() => {
        setFeedIndex(prev => (prev + 1) % LIVE_ACTIVATION_FEEDS.length);
        setShowToast(true);
      }, 500);
    }, 5500);

    return () => clearInterval(toastInterval);
  }, []);

  // Update Countdown Timer
  useEffect(() => {
    const updateCountdown = () => {
      const target = successData?.trialEndsAt
        ? new Date(successData.trialEndsAt).getTime()
        : Date.now() + 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [successData]);

  // Calculations for interactive POS preview
  const previewTotals = useMemo(() => {
    let subTotal = 0;
    let taxTotal = 0;

    for (const item of demoItems) {
      const itemSub = item.price * item.qty;
      const itemTax = (itemSub * item.gst) / 100;
      subTotal += itemSub;
      taxTotal += itemTax;
    }

    const rawGrand = subTotal + taxTotal;
    const grandTotal = Math.round(rawGrand);
    const roundOff = Number((grandTotal - rawGrand).toFixed(2));

    return {
      subTotal,
      taxTotal: Number(taxTotal.toFixed(2)),
      cgst: Number((taxTotal / 2).toFixed(2)),
      sgst: Number((taxTotal / 2).toFixed(2)),
      igst: Number(taxTotal.toFixed(2)),
      roundOff,
      grandTotal
    };
  }, [demoItems]);

  const handleAddItem = (preset: { name: string; price: number; gst: number; sku: string }) => {
    // Trigger visual scan flash
    setScanFlashAlert(`BEEP! Scanned "${preset.name}" (+₹${preset.price})`);
    setTimeout(() => setScanFlashAlert(null), 1800);

    setDemoItems(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: preset.name,
        price: preset.price,
        qty: 1,
        gst: preset.gst,
        sku: preset.sku
      }
    ]);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    setDemoItems(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const nextQty = item.qty + delta;
            return nextQty > 0 ? { ...item, qty: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as typeof prev
    );
  };

  const triggerThermalPrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
    }, 4500);
  };

  // Handle Free 7-Day Access Signup
  const handleTrialSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('SUBMITTING');
    setErrorMessage('');

    try {
      const selectedState = INDIAN_STATES.find(s => s.code === formData.stateCode) || INDIAN_STATES[0];
      const payload = {
        businessName: formData.businessName || `${formData.ownerName}'s Retail Store`,
        tradeName: formData.tradeName || formData.businessName || 'InvoDesk Retail Outlet',
        email: formData.email,
        phone: formData.phone || '+91 98220 12345',
        stateCode: selectedState.code,
        stateName: selectedState.name,
        address: {
          street: 'Main Market Road',
          city: selectedState.name,
          state: selectedState.name,
          stateCode: selectedState.code,
          pincode: '411001',
          country: 'India'
        },
        mainBranch: {
          name: `${formData.businessName || 'Flagship'} - Store 1`,
          code: 'STR-01'
        },
        owner: {
          name: formData.ownerName,
          password: formData.password || 'InvoDeskTrial@2026'
        },
        planTier: 'STARTER_TRIAL',
        billingCycle: 'TRIAL'
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize 7-day trial pass');
      }

      const trialExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      setSuccessData({
        token: data.token,
        tenantId: data.tenant.id,
        businessName: data.tenant.name,
        terminalCode: data.terminal?.terminalCode || 'TRM-01',
        trialEndsAt: trialExpiry
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('invodesk_auth_token', data.token);
        localStorage.setItem('invodesk_tenant_id', data.tenant.id);
      }

      setFormStatus('SUCCESS');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during onboarding.');
      setFormStatus('ERROR');
    }
  };

  const copyToClipboard = (text: string, type: 'token' | 'terminal') => {
    navigator.clipboard.writeText(text);
    if (type === 'token') {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    } else {
      setCopiedTerminal(true);
      setTimeout(() => setCopiedTerminal(false), 2000);
    }
  };

  const currentFeed = LIVE_ACTIVATION_FEEDS[feedIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 0%, #0F2A1E 0%, #08140E 50%, #040906 100%)',
        color: '#F0FDF4',
        fontFamily: "'Inter', sans-serif",
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* --- Embedded Keyframe Animations --- */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(-50%, -20%) scale(1); opacity: 0.22; }
          50% { transform: translate(-45%, -10%) scale(1.15); opacity: 0.32; }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(30%, 40%) scale(1); opacity: 0.15; }
          50% { transform: translate(25%, 30%) scale(1.22); opacity: 0.25; }
        }
        @keyframes laserSweep {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 92%; opacity: 1; }
          100% { top: 0%; opacity: 0.8; }
        }
        @keyframes buttonSheen {
          0% { left: -100%; }
          30%, 100% { left: 200%; }
        }
        @keyframes pulseRadar {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          70% { transform: scale(1); box-shadow: 0 0 0 12px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes receiptEject {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { transform: translateY(-50%); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes scanFlashFade {
          0% { transform: scale(0.95); opacity: 0; }
          20% { transform: scale(1.02); opacity: 1; }
          80% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.98); opacity: 0; }
        }
        @keyframes cardGlowHover {
          0% { border-color: rgba(34, 197, 94, 0.3); }
          50% { border-color: rgba(74, 222, 128, 0.8); }
          100% { border-color: rgba(34, 197, 94, 0.3); }
        }
        .anim-sheen-btn {
          position: relative;
          overflow: hidden;
        }
        .anim-sheen-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -100%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            60deg,
            transparent,
            rgba(255, 255, 255, 0.35),
            transparent
          );
          transform: rotate(25deg);
          animation: buttonSheen 4.5s infinite;
        }
        .hover-card-lift {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .hover-card-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(34, 197, 94, 0.22);
          border-color: rgba(74, 222, 128, 0.5) !important;
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* --- Ambient Glowing Floating Orbs --- */}
      <div
        style={{
          position: 'fixed',
          top: -120,
          left: '50%',
          width: 850,
          height: 500,
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.35) 0%, rgba(13, 148, 136, 0.18) 45%, transparent 75%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'floatOrb1 14s ease-in-out infinite'
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 50,
          right: '5%',
          width: 600,
          height: 450,
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, rgba(6, 78, 59, 0.15) 50%, transparent 80%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
          animation: 'floatOrb2 18s ease-in-out infinite'
        }}
      />

      {/* --- Header Navigation --- */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: 'rgba(6, 15, 11, 0.88)',
          borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
          padding: '12px 28px'
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <BrandLogo variant="dark" height={38} width={160} isDark={true} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#4ADE80',
                background: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(34, 197, 94, 0.35)',
                padding: '3px 10px',
                borderRadius: 9999,
                letterSpacing: '0.04em'
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 8px #22C55E',
                  animation: 'pulseRadar 2s infinite'
                }}
              />
              <span>v3.0 Commercial Ready</span>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: '0.88rem', fontWeight: 500 }}>
            <a href="#features" style={{ color: '#9EB3A8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Features
            </a>
            <a href="#downloads" style={{ color: '#9EB3A8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Downloads
            </a>
            <a href="#simulator" style={{ color: '#9EB3A8', textDecoration: 'none', transition: 'color 0.2s' }}>
              Live POS Demo
            </a>
            <a href="#faq" style={{ color: '#9EB3A8', textDecoration: 'none', transition: 'color 0.2s' }}>
              FAQ
            </a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: '#F0FDF4',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 8,
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Store size={14} color="#4ADE80" />
              <span>Launch Web POS</span>
            </Link>

            <a
              href="#trial-signup"
              className="anim-sheen-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 18px',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: '#052E16',
                background: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 0 18px rgba(34, 197, 94, 0.45)',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={14} />
              <span>Claim 7-Day Free Pass</span>
            </a>
          </div>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <section style={{ position: 'relative', zIndex: 1, padding: '75px 24px 45px', textAlign: 'center' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          {/* Animated Top Pill Badge with Pulse Indicator */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              padding: '6px 16px',
              borderRadius: 9999,
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              marginBottom: 24,
              fontSize: '0.84rem',
              color: '#86EFAC',
              fontWeight: 700,
              boxShadow: '0 0 16px rgba(34, 197, 94, 0.2)'
            }}
          >
            <Clock size={15} color="#22C55E" />
            <span>Limited Commercial Pilot • 1-Week Free Usage Permission Included</span>
          </div>

          <h1
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 'clamp(2.6rem, 5.8vw, 4.4rem)',
              fontWeight: 800,
              lineHeight: 1.14,
              letterSpacing: '-0.025em',
              marginBottom: 22,
              background: 'linear-gradient(180deg, #FFFFFF 20%, #A7F3D0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 30px rgba(34, 197, 94, 0.2)'
            }}
          >
            Lightning-Fast GST POS &amp; Retail Billing Engine
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
              lineHeight: 1.6,
              color: '#A7BDB2',
              maxWidth: 780,
              margin: '0 auto 36px',
              fontWeight: 400
            }}
          >
            Engineered for high-throughput Indian supermarkets, mobile hubs, pharmacies, and textile stores.
            Instant 3-second checkouts, zero-latency offline SQLite persistence, multi-rate GST,
            dynamic NPCI UPI QR codes, and cloud multi-branch synchronization.
          </p>

          {/* Primary CTA Cluster with Animated Sheen */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 38
            }}
          >
            <a
              href="#trial-signup"
              className="anim-sheen-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '15px 32px',
                fontSize: '1.08rem',
                fontWeight: 800,
                color: '#052E16',
                background: 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
                borderRadius: 12,
                textDecoration: 'none',
                boxShadow: '0 6px 26px rgba(34, 197, 94, 0.5)',
                transition: 'transform 0.15s ease'
              }}
            >
              <Zap size={20} />
              <span>Get 1-Week Free Access Pass</span>
              <ArrowRight size={18} />
            </a>

            <a
              href="#downloads"
              className="hover-card-lift"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '15px 28px',
                fontSize: '1.02rem',
                fontWeight: 600,
                color: '#F0FDF4',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 12,
                textDecoration: 'none',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Download size={20} color="#4ADE80" />
              <span>Download Native App</span>
            </a>
          </div>

          {/* Real-Time Live Guarantee Pills */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 20,
              fontSize: '0.84rem',
              color: '#86EFAC'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16} color="#22C55E" />
              <span>No Credit Card Required</span>
            </span>
            <span style={{ color: 'rgba(34, 197, 94, 0.4)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Monitor size={16} color="#22C55E" />
              <span>
                Detected: {detectedOS === 'windows' ? 'Windows 64-bit' : detectedOS === 'linux' ? 'Linux' : 'Desktop'}
              </span>
            </span>
            <span style={{ color: 'rgba(34, 197, 94, 0.4)' }}>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#22C55E" />
              <span>Full Commercial Features Unlocked</span>
            </span>
          </div>
        </div>
      </section>

      {/* --- Infinite Marquee Strip --- */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(5, 17, 12, 0.95)',
          borderTop: '1px solid rgba(34, 197, 94, 0.18)',
          borderBottom: '1px solid rgba(34, 197, 94, 0.18)',
          padding: '14px 0',
          marginBottom: 70
        }}
      >
        <div className="marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 32px',
                color: '#86EFAC',
                fontSize: '0.88rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{item}</span>
              <span style={{ color: 'rgba(34, 197, 94, 0.3)', marginLeft: 16 }}>•</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- Direct Native App Downloads Section --- */}
      <section
        id="downloads"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          margin: '0 auto 75px',
          padding: '0 24px'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(20, 42, 31, 0.85) 0%, rgba(11, 23, 17, 0.95) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 20,
            padding: '38px 32px',
            boxShadow: '0 24px 50px rgba(0, 0, 0, 0.6)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 34 }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#4ADE80',
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}
            >
              Standalone Desktop Engine
            </span>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: '2.1rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginTop: 6
              }}
            >
              Download InvoDesk Desktop Client
            </h2>
            <p style={{ color: '#9EB3A8', fontSize: '0.96rem', maxWidth: 650, margin: '8px auto 0' }}>
              Includes local SQLite offline transaction persistence, hardware ESC/POS thermal printer driver,
              and instant cloud sync engine.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 22
            }}
          >
            {/* Windows Download Card */}
            <div
              className="hover-card-lift"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: detectedOS === 'windows' ? '2px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 16,
                padding: '28px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: detectedOS === 'windows' ? '0 0 24px rgba(34, 197, 94, 0.25)' : 'none'
              }}
            >
              {detectedOS === 'windows' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    background: '#22C55E',
                    color: '#052E16',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)'
                  }}
                >
                  RECOMMENDED FOR YOUR OS
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.18)',
                      padding: 12,
                      borderRadius: 12,
                      color: '#4ADE80'
                    }}
                  >
                    <Monitor size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>Windows 10 / 11</h3>
                    <span style={{ fontSize: '0.8rem', color: '#86EFAC', fontWeight: 600 }}>64-bit Installer (.exe) • 104 MB</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: 22 }}>
                  Standard Windows desktop installer with automatic desktop shortcut, receipt printer USB driver, and
                  isolated local database storage.
                </p>
              </div>

              <div>
                <a
                  href="/downloads/invodesk-setup.exe"
                  download="InvoDeskPOS-1.0.0-win-x64.exe"
                  className="anim-sheen-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '13px 18px',
                    background: '#22C55E',
                    color: '#052E16',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={18} />
                  <span>Download Windows (.exe)</span>
                </a>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.74rem', color: '#8FA097' }}>
                  SHA-256 Verified • Standalone Electron Architecture
                </div>
              </div>
            </div>

            {/* Linux Debian (.deb) Download Card */}
            <div
              className="hover-card-lift"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: detectedOS === 'linux' ? '2px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 16,
                padding: '28px 24px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: detectedOS === 'linux' ? '0 0 24px rgba(34, 197, 94, 0.25)' : 'none'
              }}
            >
              {detectedOS === 'linux' && (
                <div
                  style={{
                    position: 'absolute',
                    top: -12,
                    right: 20,
                    background: '#22C55E',
                    color: '#052E16',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: 9999,
                    letterSpacing: '0.04em',
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)'
                  }}
                >
                  RECOMMENDED FOR YOUR OS
                </div>
              )}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.18)',
                      padding: 12,
                      borderRadius: 12,
                      color: '#4ADE80'
                    }}
                  >
                    <Terminal size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>Linux Debian / Ubuntu</h3>
                    <span style={{ fontSize: '0.8rem', color: '#86EFAC', fontWeight: 600 }}>Debian Package (.deb) • 89.7 MB</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: 22 }}>
                  Native deb package for Ubuntu 20.04+, Debian 11+, and Linux Mint. Integrates with systemd, desktop
                  launchers, and raw lp/USB printer endpoints.
                </p>
              </div>

              <div>
                <a
                  href="/downloads/invodesk-pos.deb"
                  download="InvoDeskPOS-1.0.0-linux-amd64.deb"
                  className="anim-sheen-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '13px 18px',
                    background: '#22C55E',
                    color: '#052E16',
                    fontWeight: 800,
                    fontSize: '0.94rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    boxShadow: '0 4px 16px rgba(34, 197, 94, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={18} />
                  <span>Download Linux (.deb)</span>
                </a>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.74rem', color: '#8FA097' }}>
                  Install via: <code>sudo dpkg -i InvoDeskPOS-*.deb</code>
                </div>
              </div>
            </div>

            {/* Universal Linux AppImage */}
            <div
              className="hover-card-lift"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 16,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.18)',
                      padding: 12,
                      borderRadius: 12,
                      color: '#4ADE80'
                    }}
                  >
                    <Layers size={26} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>Linux Universal</h3>
                    <span style={{ fontSize: '0.8rem', color: '#86EFAC', fontWeight: 600 }}>Portable AppImage • 125.5 MB</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#CBD5E1', lineHeight: 1.5, marginBottom: 22 }}>
                  Zero-installation portable binary for Fedora, Arch, CentOS, and any modern 64-bit Linux distribution.
                  Just make executable and launch.
                </p>
              </div>

              <div>
                <a
                  href="/downloads/invodesk-pos.AppImage"
                  download="InvoDeskPOS-1.0.0-linux-x86_64.AppImage"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '13px 18px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F0FDF4',
                    fontWeight: 700,
                    fontSize: '0.94rem',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Download size={18} />
                  <span>Download AppImage</span>
                </a>
                <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.74rem', color: '#8FA097' }}>
                  Execution: <code>chmod +x invodesk-pos.AppImage</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Sign-Up for 1-Week Free Usage Permission Section --- */}
      <section
        id="trial-signup"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 960,
          margin: '0 auto 85px',
          padding: '0 24px'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(20, 48, 35, 0.95) 0%, rgba(9, 21, 16, 0.98) 100%)',
            border: '2px solid rgba(34, 197, 94, 0.45)',
            borderRadius: 22,
            padding: '44px 38px',
            boxShadow: '0 0 36px rgba(34, 197, 94, 0.28)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated top edge gradient border */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'linear-gradient(90deg, #22C55E 0%, #4ADE80 50%, #166B50 100%)'
            }}
          />

          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 14px',
                borderRadius: 9999,
                background: 'rgba(34, 197, 94, 0.2)',
                color: '#4ADE80',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: 12
              }}
            >
              <Sparkles size={15} />
              <span>1-Week Commercial Usage License</span>
            </div>
            <h2
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(1.9rem, 3.8vw, 2.5rem)',
                fontWeight: 800,
                color: '#FFFFFF'
              }}
            >
              Activate Your 7-Day Free Week Pass
            </h2>
            <p style={{ color: '#A7BDB2', fontSize: '0.96rem', maxWidth: 620, margin: '8px auto 0' }}>
              Instant provisioning of your dedicated multi-tenant store catalog, branch terminal credentials, and
              unrestricted GST POS privileges for 7 days.
            </p>
          </div>

          {formStatus === 'SUCCESS' && successData ? (
            /* --- Success Activation Screen --- */
            <div
              style={{
                background: 'rgba(5, 46, 22, 0.65)',
                border: '1px solid #22C55E',
                borderRadius: 18,
                padding: '36px 30px',
                textAlign: 'center',
                boxShadow: '0 0 30px rgba(34, 197, 94, 0.3)'
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  background: 'rgba(34, 197, 94, 0.22)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#4ADE80',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)'
                }}
              >
                <CheckCircle2 size={40} />
              </div>

              <h3 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
                7-Day Free Week Pass Activated!
              </h3>
              <p style={{ color: '#86EFAC', fontSize: '0.96rem', marginBottom: 26 }}>
                Store <strong style={{ color: '#FFFFFF' }}>{successData.businessName}</strong> has been provisioned with full commercial capabilities.
              </p>

              {/* Live Expiration Countdown Box */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.45)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  borderRadius: 14,
                  padding: '18px 24px',
                  maxWidth: 520,
                  margin: '0 auto 26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-around',
                  boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5)'
                }}
              >
                <div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ADE80', fontFamily: 'monospace' }}>
                    {timeLeft.days}d
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9EB3A8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Days Left
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', color: '#22C55E' }}>:</div>
                <div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ADE80', fontFamily: 'monospace' }}>
                    {String(timeLeft.hours).padStart(2, '0')}h
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9EB3A8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Hours
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', color: '#22C55E' }}>:</div>
                <div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ADE80', fontFamily: 'monospace' }}>
                    {String(timeLeft.minutes).padStart(2, '0')}m
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9EB3A8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Minutes
                  </div>
                </div>
                <div style={{ fontSize: '1.8rem', color: '#22C55E' }}>:</div>
                <div>
                  <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#4ADE80', fontFamily: 'monospace' }}>
                    {String(timeLeft.seconds).padStart(2, '0')}s
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#9EB3A8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Seconds
                  </div>
                </div>
              </div>

              {/* Credentials & Tokens */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 12,
                  padding: '18px 20px',
                  textAlign: 'left',
                  maxWidth: 620,
                  margin: '0 auto 28px',
                  fontSize: '0.88rem'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 12
                  }}
                >
                  <span style={{ color: '#9EB3A8' }}>Assigned Terminal Code:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code style={{ color: '#4ADE80', fontWeight: 800, fontSize: '0.94rem' }}>
                      {successData.terminalCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(successData.terminalCode, 'terminal')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedTerminal ? '#4ADE80' : '#CBD5E1',
                        cursor: 'pointer'
                      }}
                      title="Copy Terminal Code"
                    >
                      {copiedTerminal ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#9EB3A8' }}>Trial License JWT:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <code
                      style={{
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: '#4ADE80'
                      }}
                    >
                      {successData.token}
                    </code>
                    <button
                      onClick={() => copyToClipboard(successData.token, 'token')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: copiedToken ? '#4ADE80' : '#CBD5E1',
                        cursor: 'pointer'
                      }}
                      title="Copy Auth Token"
                    >
                      {copiedToken ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
                <Link
                  href="/"
                  className="anim-sheen-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 26px',
                    background: '#22C55E',
                    color: '#052E16',
                    fontWeight: 800,
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.98rem',
                    boxShadow: '0 4px 18px rgba(34, 197, 94, 0.45)'
                  }}
                >
                  <Store size={18} />
                  <span>Launch Web POS Instantly</span>
                  <ArrowRight size={18} />
                </Link>

                <a
                  href="/downloads/invodesk-setup.exe"
                  download="InvoDeskPOS-1.0.0-win-x64.exe"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 22px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F0FDF4',
                    fontWeight: 700,
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.96rem'
                  }}
                >
                  <Download size={18} />
                  <span>Download Windows App</span>
                </a>

                <a
                  href="/downloads/invodesk-pos.deb"
                  download="InvoDeskPOS-1.0.0-linux-amd64.deb"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 22px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#F0FDF4',
                    fontWeight: 700,
                    borderRadius: 10,
                    textDecoration: 'none',
                    fontSize: '0.96rem'
                  }}
                >
                  <Download size={18} />
                  <span>Download Linux .deb</span>
                </a>
              </div>

              {/* 1-Week usage permission transparency notice & Contact Details */}
              <div
                style={{
                  marginTop: 26,
                  fontSize: '0.82rem',
                  color: '#9EB3A8',
                  maxWidth: 620,
                  margin: '26px auto 0',
                  lineHeight: 1.6,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  textAlign: 'left'
                }}
              >
                <div style={{ color: '#F0FDF4', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⏱️ 1-Week Usage Permission:</span>
                </div>
                <div>
                  This standalone download and cloud account is fully authorized for <strong>7 days of unrestricted commercial usage</strong>.
                  After 7 days, to avail the <strong>Main Permanent Production Version</strong>, please contact:
                </div>
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  <a
                    href="https://wa.me/919962726106?text=Hi%20Salman,%20I%20have%20tested%20InvoDesk%20POS%20and%20want%20to%20avail%20the%20main%20version"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#22C55E',
                      color: '#052E16',
                      fontWeight: 800,
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      textDecoration: 'none'
                    }}
                  >
                    <span>WhatsApp / Call: +91 9962726106</span>
                  </a>
                  <a
                    href="mailto:salmanulfariss642@gmail.com?subject=InvoDesk%20Main%20Version%20Inquiry"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#F0FDF4',
                      fontWeight: 700,
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: '0.82rem',
                      textDecoration: 'none',
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                  >
                    <span>Email: salmanulfariss642@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* --- Onboarding Form --- */
            <form onSubmit={handleTrialSignup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {errorMessage && (
                <div
                  style={{
                    gridColumn: 'span 2',
                    background: 'rgba(239, 68, 68, 0.18)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#FCA5A5',
                    borderRadius: 10,
                    padding: '12px 16px',
                    fontSize: '0.88rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Business Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>
                  Business / Legal Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Supermarket Pvt Ltd"
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease'
                  }}
                />
              </div>

              {/* Trade Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>
                  Store / Trade Name (Printed on Bill)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Apex Provisions & Mart"
                  value={formData.tradeName}
                  onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>Retail Vertical</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                >
                  {RETAIL_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ background: '#13241C' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>
                  State (GST Jurisdictional Code) *
                </label>
                <select
                  value={formData.stateCode}
                  onChange={e => setFormData({ ...formData, stateCode: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                >
                  {INDIAN_STATES.map(s => (
                    <option key={s.code} value={s.code} style={{ background: '#13241C' }}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Owner Full Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>Owner Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.ownerName}
                  onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Owner Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>Owner Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. owner@apexretail.in"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98220 12345"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Master Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: '0.84rem', fontWeight: 700, color: '#A7BDB2' }}>Master Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: 8,
                    padding: '11px 14px',
                    color: '#FFFFFF',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <div style={{ gridColumn: 'span 2', marginTop: 12 }}>
                <button
                  type="submit"
                  disabled={formStatus === 'SUBMITTING'}
                  className="anim-sheen-btn"
                  style={{
                    width: '100%',
                    padding: '15px 22px',
                    background: formStatus === 'SUBMITTING' ? '#166B50' : 'linear-gradient(135deg, #4ADE80 0%, #22C55E 100%)',
                    color: '#052E16',
                    fontSize: '1.08rem',
                    fontWeight: 800,
                    borderRadius: 12,
                    border: 'none',
                    cursor: formStatus === 'SUBMITTING' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 22px rgba(34, 197, 94, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10
                  }}
                >
                  <Sparkles size={20} />
                  <span>
                    {formStatus === 'SUBMITTING'
                      ? 'Provisioning 7-Day Tenant...'
                      : 'Claim 7-Day Free Week Pass & Get Download Link'}
                  </span>
                </button>
                <p
                  style={{
                    textAlign: 'center',
                    fontSize: '0.78rem',
                    color: '#8FA097',
                    marginTop: 10
                  }}
                >
                  ⏱️ 1-Week Free Usage Permission: Grants 7 days of full commercial multi-branch, POS, and inventory features. No credit card required.
                </p>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* --- Live Interactive POS Billing Simulator with Laser Scanner & Thermal Eject --- */}
      <section
        id="simulator"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          margin: '0 auto 85px',
          padding: '0 24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#4ADE80',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Real-World Interactive Demonstration
          </span>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.2rem',
              fontWeight: 800,
              color: '#FFFFFF',
              marginTop: 6
            }}
          >
            Experience 3-Second Checkout Speed
          </h2>
          <p style={{ color: '#9EB3A8', fontSize: '0.96rem', maxWidth: 640, margin: '8px auto 0' }}>
            Simulate instant line additions, live barcode scanner beam, automatic GST calculation (CGST/SGST vs IGST),
            dynamic UPI QR generation, and animated ESC/POS thermal printing.
          </p>
        </div>

        {/* Scan Flash Alert Toast */}
        {scanFlashAlert && (
          <div
            style={{
              maxWidth: 500,
              margin: '0 auto 16px',
              background: '#22C55E',
              color: '#052E16',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 18px rgba(34, 197, 94, 0.6)',
              animation: 'scanFlashFade 1.8s forwards'
            }}
          >
            <Barcode size={18} />
            <span>{scanFlashAlert}</span>
          </div>
        )}

        <div
          style={{
            background: 'rgba(15, 32, 24, 0.9)',
            border: '1px solid rgba(34, 197, 94, 0.35)',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.6)'
          }}
        >
          {/* Mock Counter Top Bar */}
          <div
            style={{
              background: 'rgba(5, 20, 14, 0.98)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '14px 24px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              fontSize: '0.84rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 800, color: '#4ADE80' }}>POS Terminal #01</span>
              <span style={{ color: '#64748B' }}>•</span>
              <span style={{ color: '#94A3B8' }}>Operator: Rajesh Kumar</span>
              <span style={{ color: '#64748B' }}>•</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  color: '#4ADE80',
                  background: 'rgba(34, 197, 94, 0.15)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontWeight: 600
                }}
              >
                <Wifi size={13} />
                <span>SQLite Engine Active</span>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setIsInterState(!isInterState)}
                style={{
                  background: isInterState ? 'rgba(56, 189, 248, 0.18)' : 'rgba(34, 197, 94, 0.18)',
                  color: isInterState ? '#38BDF8' : '#4ADE80',
                  border: '1px solid currentColor',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isInterState ? 'Inter-State (IGST 100%)' : 'Intra-State (CGST 50% + SGST 50%)'}
              </button>
            </div>
          </div>

          {/* Counter Body */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', minHeight: 400 }}>
            {/* Left: Product Picker & Bill Items */}
            <div style={{ padding: '24px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              {/* Interactive Laser Barcode Scanner Simulator */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(34, 197, 94, 0.25)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Laser Scanning Line */}
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    height: 2,
                    background: '#22C55E',
                    boxShadow: '0 0 10px #22C55E, 0 0 4px #4ADE80',
                    animation: 'laserSweep 2.2s ease-in-out infinite'
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Barcode size={24} color="#4ADE80" />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#FFFFFF' }}>
                      Handheld 1D/2D Barcode Scanner
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#9EB3A8' }}>
                      Click any SKU below to simulate instant laser beam decode
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: '0.74rem',
                    color: '#4ADE80',
                    fontWeight: 700,
                    background: 'rgba(34, 197, 94, 0.12)',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}
                >
                  READY
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94A3B8' }}>
                  Click SKU to Scan Into Bill:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() =>
                      handleAddItem({
                        name: 'Tata Salt 1kg (Vacuum Packed)',
                        price: 28,
                        gst: 0,
                        sku: '890105885230'
                      })
                    }
                    className="hover-card-lift"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F0FDF4',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Tata Salt (₹28, 0% GST)
                  </button>
                  <button
                    onClick={() =>
                      handleAddItem({
                        name: 'Dolo 650 Tablets (Strip of 15)',
                        price: 32,
                        gst: 12,
                        sku: '890224410055'
                      })
                    }
                    className="hover-card-lift"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F0FDF4',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Dolo 650 (₹32, 12% GST)
                  </button>
                  <button
                    onClick={() =>
                      handleAddItem({
                        name: 'Mi 20000mAh Power Bank Fast Charge',
                        price: 1999,
                        gst: 18,
                        sku: '890435210988'
                      })
                    }
                    className="hover-card-lift"
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F0FDF4',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + Power Bank (₹1,999, 18% GST)
                  </button>
                </div>
              </div>

              {/* Bill Items List */}
              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {demoItems.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.035)',
                      borderRadius: 10,
                      marginBottom: 8,
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFFFFF' }}>{item.name}</div>
                      <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                        ₹{item.price} each • GST Rate: {item.gst}% • Barcode: <code>{item.sku}</code>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleUpdateQty(item.id, -1)}
                          style={{
                            width: 26,
                            height: 26,
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.88rem', fontWeight: 800, minWidth: 20, textAlign: 'center' }}>
                          {item.qty}
                        </span>
                        <button
                          onClick={() => handleUpdateQty(item.id, 1)}
                          style={{
                            width: 26,
                            height: 26,
                            background: 'rgba(255, 255, 255, 0.12)',
                            border: 'none',
                            color: '#FFFFFF',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: 700
                          }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#4ADE80', minWidth: 70, textAlign: 'right' }}>
                        ₹{(item.price * item.qty).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Tax Breakdown & Bill Total Summary */}
            <div style={{ padding: '24px', background: 'rgba(5, 17, 12, 0.55)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#A7BDB2', marginBottom: 14 }}>
                  Real-Time Financial Settlement
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.86rem', color: '#CBD5E1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Taxable Subtotal:</span>
                    <span style={{ fontWeight: 700, color: '#FFFFFF' }}>₹{previewTotals.subTotal.toLocaleString()}</span>
                  </div>

                  {!isInterState ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                        <span>CGST (Central):</span>
                        <span>+₹{previewTotals.cgst.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                        <span>SGST (State):</span>
                        <span>+₹{previewTotals.sgst.toLocaleString()}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38BDF8' }}>
                      <span>IGST (Integrated 100%):</span>
                      <span>+₹{previewTotals.igst.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Total Tax Surcharges:</span>
                    <span>₹{previewTotals.taxTotal.toLocaleString()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Rupee Round Off:</span>
                    <span>{previewTotals.roundOff >= 0 ? `+₹${previewTotals.roundOff}` : `-₹${Math.abs(previewTotals.roundOff)}`}</span>
                  </div>

                  <div
                    style={{
                      borderTop: '1px solid rgba(255, 255, 255, 0.15)',
                      paddingTop: 10,
                      marginTop: 4,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline'
                    }}
                  >
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Grand Total:</span>
                    <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#4ADE80' }}>
                      ₹{previewTotals.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Settlement Method Selector */}
                <div style={{ marginTop: 18 }}>
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Settlement Mode
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                    {(['CASH', 'UPI', 'CARD', 'KHATA'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setSelectedPaymentMode(mode)}
                        style={{
                          background: selectedPaymentMode === mode ? '#22C55E' : 'rgba(34, 197, 94, 0.1)',
                          color: selectedPaymentMode === mode ? '#052E16' : '#4ADE80',
                          border: '1px solid rgba(34, 197, 94, 0.35)',
                          borderRadius: 8,
                          padding: '8px 4px',
                          textAlign: 'center',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {mode === 'CASH' && <Coins size={14} style={{ margin: '0 auto 2px' }} />}
                        {mode === 'UPI' && <QrCode size={14} style={{ margin: '0 auto 2px' }} />}
                        {mode === 'CARD' && <CreditCard size={14} style={{ margin: '0 auto 2px' }} />}
                        {mode === 'KHATA' && <BookOpen size={14} style={{ margin: '0 auto 2px' }} />}
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Print Receipt Action */}
              <div style={{ marginTop: 18 }}>
                <button
                  onClick={triggerThermalPrint}
                  disabled={isPrinting}
                  className="anim-sheen-btn"
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: isPrinting ? '#166B50' : 'rgba(34, 197, 94, 0.25)',
                    border: '1px solid #22C55E',
                    color: '#F0FDF4',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    borderRadius: 10,
                    cursor: isPrinting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Printer size={16} color="#4ADE80" />
                  <span>{isPrinting ? 'Printing ESC/POS Bill...' : 'Print Thermal Receipt (ESC/POS)'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Animated Thermal Receipt Ejection Tray */}
          {isPrinting && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '20px',
                borderTop: '2px dashed rgba(34, 197, 94, 0.4)',
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  background: '#FFFFFF',
                  color: '#111827',
                  width: 320,
                  padding: '16px 20px',
                  borderRadius: '4px 4px 12px 12px',
                  fontFamily: 'monospace',
                  fontSize: '0.78rem',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.8)',
                  animation: 'receiptEject 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                }}
              >
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #6B7280', paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: '0.95rem' }}>APEX SUPERMART</div>
                  <div>GSTIN: 27AAACA1234A1Z5</div>
                  <div>Pune Main Outlet (STR-01)</div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <div>INV NO: INV-2026-0042</div>
                  <div>DATE: {new Date().toLocaleDateString('en-IN')}</div>
                  <div>MODE: {selectedPaymentMode} • SETTLED</div>
                </div>

                <div style={{ borderTop: '1px dashed #9CA3AF', borderBottom: '1px dashed #9CA3AF', padding: '6px 0', marginBottom: 8 }}>
                  {demoItems.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span>{item.name.substring(0, 16)} x{item.qty}</span>
                      <span>₹{item.price * item.qty}</span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'right', fontWeight: 900, fontSize: '1rem', marginTop: 4 }}>
                  NET PAID: ₹{previewTotals.grandTotal.toLocaleString()}
                </div>

                <div style={{ textAlign: 'center', marginTop: 10, fontSize: '0.68rem', color: '#4B5563' }}>
                  Thank You • Visit Again!<br />
                  Powered by InvoDesk POS Engine
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* --- Core Architectural Capabilities Grid --- */}
      <section
        id="features"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1180,
          margin: '0 auto 85px',
          padding: '0 24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 42 }}>
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: '#4ADE80',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            Engineering Foundation
          </span>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.3rem',
              fontWeight: 800,
              color: '#FFFFFF',
              marginTop: 6
            }}
          >
            Engineered for High-Pressure Retail
          </h2>
          <p style={{ color: '#9EB3A8', fontSize: '0.98rem', maxWidth: 650, margin: '8px auto 0' }}>
            Combines the offline robustness of native C-bindings SQLite with the multi-tenant scalability of
            PostgreSQL 16+.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 22
          }}
        >
          {/* Feature 1 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <WifiOff size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              True Offline-First SQLite
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Bills are generated and stored locally in embedded SQLite when broadband drops. Background push synchronizes
              completed transactions once connectivity recovers with zero duplicate numbering.
            </p>
          </div>

          {/* Feature 2 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <Coins size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              Multi-Rate GST &amp; GSTR-1
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Full compliance with Indian GST slabs (0%, 5%, 12%, 18%, 28%). Auto-computes CGST, SGST, IGST, reverse
              MRP tax calculations, and generates exportable HSN summaries.
            </p>
          </div>

          {/* Feature 3 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <Store size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              Multi-Branch Inventory Locks
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              PostgreSQL row-level locking (<code>SELECT ... FOR UPDATE</code>) guarantees atomic stock validation across
              multiple checkout terminals and completely isolated branch catalogs.
            </p>
          </div>

          {/* Feature 4 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <Printer size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              Thermal ESC/POS &amp; Barcode
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Direct formatted thermal receipt printing for 80mm and 58mm roll widths. Zero-configuration USB and network
              escpos raw transmission, plus barcode scanner wedge listening.
            </p>
          </div>

          {/* Feature 5 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              Customer Khata Ledger
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Track regular neighborhood customer credit accounts with atomic balance updates, credit limits, partial
              settlement history, and WhatsApp / SMS invoice sharing.
            </p>
          </div>

          {/* Feature 6 */}
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.025)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 16,
              padding: '30px 24px'
            }}
          >
            <div
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ADE80',
                width: 46,
                height: 46,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 18
              }}
            >
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>
              Audited Returns &amp; Reversals
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Payments cannot be silently overwritten. Any return or reversal creates an audited transaction record,
              re-adjusts invoice balances, and logs operator timestamps to the immutable audit trail.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section
        id="faq"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 900,
          margin: '0 auto 85px',
          padding: '0 24px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 38 }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '2.1rem',
              fontWeight: 800,
              color: '#FFFFFF'
            }}
          >
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#9EB3A8', fontSize: '0.94rem', marginTop: 6 }}>
            Everything you need to know about your 1-week usage permission and native installation.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 14,
              padding: '22px 24px'
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              How do I avail the permanent main version after the 7-day trial?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              If you like InvoDesk during your 7-day access, you can avail the permanent main version with dedicated multi-branch
              cloud hosting and priority support. Simply contact <strong>Salmanul Faris</strong> directly via Phone / WhatsApp at{' '}
              <a href="tel:+919962726106" style={{ color: '#4ADE80', fontWeight: 700, textDecoration: 'none' }}>+91 9962726106</a>{' '}
              or email{' '}
              <a href="mailto:salmanulfariss642@gmail.com" style={{ color: '#4ADE80', fontWeight: 700, textDecoration: 'none' }}>salmanulfariss642@gmail.com</a>.
            </p>
          </div>

          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 14,
              padding: '22px 24px'
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              What happens after the 1-week free trial expires?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Your local billing records and SQLite database remain completely safe on your local computer. However, cloud
              synchronization and multi-branch updates will pause until you upgrade to a Starter, Growth, or Enterprise plan.
            </p>
          </div>

          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 14,
              padding: '22px 24px'
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Do I need a credit card to sign up for the 7-day pass?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              No! No credit card or upfront payment is required. You get an immediate download link for Windows and Linux along
              with cloud credentials upon submitting your store name.
            </p>
          </div>

          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 14,
              padding: '22px 24px'
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Will InvoDesk continue billing if the internet disconnects?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              Yes. The native desktop app embeds a full local SQLite database. Cash, UPI, and Card transactions continue to
              print receipts without any lag. When your network connection resumes, the sync engine securely pushes offline
              bills to the cloud.
            </p>
          </div>

          <div
            className="hover-card-lift"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: 14,
              padding: '22px 24px'
            }}
          >
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
              Can I use standard thermal printers and barcode scanners?
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#94A3B8', lineHeight: 1.6 }}>
              InvoDesk natively supports all standard 80mm and 58mm thermal receipt printers (TVS, Epson, Posiflex, NGX)
              via USB or Network ESC/POS protocols, as well as USB handheld barcode guns.
            </p>
          </div>
        </div>
      </section>

      {/* --- Live Floating Social Proof Toast (Bottom-Left) --- */}
      {showToast && currentFeed && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 60,
            background: 'rgba(8, 20, 15, 0.94)',
            border: '1px solid rgba(34, 197, 94, 0.45)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            maxWidth: 360,
            animation: 'scanFlashFade 5.5s forwards'
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#4ADE80',
              flexShrink: 0
            }}
          >
            <Store size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#FFFFFF' }}>
              {currentFeed.store} ({currentFeed.city})
            </div>
            <div style={{ fontSize: '0.74rem', color: '#86EFAC' }}>
              {currentFeed.action} • <span style={{ color: '#9EB3A8' }}>{currentFeed.time}</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Footer --- */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(4, 9, 6, 0.96)',
          padding: '42px 24px',
          fontSize: '0.86rem',
          color: '#8FA097'
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 20
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BrandLogo variant="dark" height={32} width={130} isDark={true} />
            <span>© 2026 InvoDesk Inc. • Main Version & Support: <a href="tel:+919962726106" style={{ color: '#4ADE80', textDecoration: 'none', fontWeight: 700 }}>+91 9962726106</a> (<a href="mailto:salmanulfariss642@gmail.com" style={{ color: '#86EFAC', textDecoration: 'none' }}>salmanulfariss642@gmail.com</a>)</span>
          </div>

          <div style={{ display: 'flex', gap: 22 }}>
            <a href="/downloads/invodesk-setup.exe" style={{ color: '#A7BDB2', textDecoration: 'none' }}>
              Windows .exe
            </a>
            <a href="/downloads/invodesk-pos.deb" style={{ color: '#A7BDB2', textDecoration: 'none' }}>
              Linux .deb
            </a>
            <a href="/downloads/invodesk-pos.AppImage" style={{ color: '#A7BDB2', textDecoration: 'none' }}>
              AppImage
            </a>
            <Link href="/" style={{ color: '#4ADE80', textDecoration: 'none', fontWeight: 700 }}>
              Open Web POS Counter →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
