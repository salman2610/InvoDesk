'use client';

import React from 'react';

export interface BrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'mark' | 'dark' | 'mono';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  height?: number | string;
  width?: number | string;
  className?: string;
  isDark?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  height,
  width,
  className = '',
  isDark = false
}) => {
  const dimensions = React.useMemo(() => {
    if (height || width) {
      return { height, width };
    }
    switch (variant) {
      case 'mark':
        switch (size) {
          case 'sm': return { height: 32, width: 32 };
          case 'md': return { height: 42, width: 42 };
          case 'lg': return { height: 54, width: 54 };
          case 'xl': return { height: 76, width: 76 };
        }
      case 'vertical':
        switch (size) {
          case 'sm': return { height: 96, width: 96 };
          case 'md': return { height: 136, width: 136 };
          case 'lg': return { height: 180, width: 180 };
          case 'xl': return { height: 240, width: 240 };
        }
      case 'horizontal':
      case 'dark':
      case 'mono':
      default:
        switch (size) {
          case 'sm': return { height: 36, width: 162 };
          case 'md': return { height: 46, width: 208 };
          case 'lg': return { height: 58, width: 262 };
          case 'xl': return { height: 72, width: 325 };
        }
    }
  }, [variant, size, height, width]);

  const resolvedVariant = React.useMemo(() => {
    if (variant === 'mark' || variant === 'mono' || variant === 'vertical') {
      return variant;
    }
    if (isDark) {
      return 'dark';
    }
    return 'horizontal';
  }, [variant, isDark]);

  if (resolvedVariant === 'mark') {
    return (
      <svg
        viewBox="110 120 770 830"
        width={dimensions.width}
        height={dimensions.height}
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="markSwoosh" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#166B50" />
            <stop offset="35%" stopColor="#199E6E" />
            <stop offset="100%" stopColor="#22C55E" />
          </linearGradient>
        </defs>
        <path
          d="M 330 160 C 270 160, 220 210, 220 270 L 220 730 C 220 790, 270 840, 330 840 L 640 840 C 700 840, 750 790, 750 730 L 750 360 L 550 160 Z"
          fill="#FFFFFF"
          stroke={isDark ? '#22C55E' : '#166B50'}
          strokeWidth="56"
          strokeLinejoin="round"
        />
        <path d="M 550 160 L 750 360 L 590 360 C 568 360, 550 342, 550 320 Z" fill="#22C55E" />
        <rect x="310" y="300" width="160" height="32" rx="16" fill="#172B25" />
        <rect x="310" y="380" width="240" height="32" rx="16" fill="#172B25" />
        <rect x="310" y="460" width="200" height="32" rx="16" fill="#172B25" />
        <rect x="470" y="650" width="56" height="130" rx="14" fill="#166B50" />
        <rect x="546" y="570" width="56" height="210" rx="14" fill="#166B50" />
        <rect x="622" y="490" width="56" height="290" rx="14" fill="#166B50" />
        <path
          d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z"
          fill="url(#markSwoosh)"
        />
      </svg>
    );
  }

  if (resolvedVariant === 'dark') {
    return (
      <svg
        viewBox="140 75 1540 375"
        width={dimensions.width}
        height={dimensions.height}
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="darkSwooshInline" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#166B50" />
            <stop offset="35%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#4ADE80" />
          </linearGradient>
        </defs>
        <g transform="translate(100, 26) scale(0.45)">
          <path
            d="M 330 160 C 270 160, 220 210, 220 270 L 220 730 C 220 790, 270 840, 330 840 L 640 840 C 700 840, 750 790, 750 730 L 750 360 L 550 160 Z"
            fill="transparent"
            stroke="#FFFFFF"
            strokeWidth="56"
            strokeLinejoin="round"
          />
          <path d="M 550 160 L 750 360 L 590 360 C 568 360, 550 342, 550 320 Z" fill="#22C55E" />
          <rect x="310" y="300" width="160" height="32" rx="16" fill="#FFFFFF" />
          <rect x="310" y="380" width="240" height="32" rx="16" fill="#FFFFFF" />
          <rect x="310" y="460" width="200" height="32" rx="16" fill="#FFFFFF" />
          <rect x="470" y="650" width="56" height="130" rx="14" fill="#FFFFFF" />
          <rect x="546" y="570" width="56" height="210" rx="14" fill="#FFFFFF" />
          <rect x="622" y="490" width="56" height="290" rx="14" fill="#FFFFFF" />
          <path
            d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z"
            fill="url(#darkSwooshInline)"
          />
        </g>
        <g transform="translate(560, 315)">
          <text
            fontFamily="'Inter', -apple-system, sans-serif"
            fontWeight="800"
            fontSize="230"
            letterSpacing="-4"
          >
            <tspan fill="#FFFFFF">Invo</tspan>
            <tspan fill="#22C55E">Desk</tspan>
          </text>
        </g>
        <line x1="565" y1="398" x2="665" y2="398" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
        <text
          x="690"
          y="408"
          fontFamily="'Inter', -apple-system, sans-serif"
          fontWeight="700"
          fontSize="31"
          letterSpacing="6.5"
          fill="#9EB3A8"
        >
          GST BILLING &amp; BUSINESS OPERATIONS
        </text>
        <line x1="1540" y1="398" x2="1640" y2="398" stroke="#22C55E" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="140 75 1540 375"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="horizSwooshInline" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#166B50" />
          <stop offset="35%" stopColor="#199E6E" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      <g transform="translate(100, 26) scale(0.45)">
        <path
          d="M 330 160 C 270 160, 220 210, 220 270 L 220 730 C 220 790, 270 840, 330 840 L 640 840 C 700 840, 750 790, 750 730 L 750 360 L 550 160 Z"
          fill="#FFFFFF"
          stroke="#166B50"
          strokeWidth="56"
          strokeLinejoin="round"
        />
        <path d="M 550 160 L 750 360 L 590 360 C 568 360, 550 342, 550 320 Z" fill="#22C55E" />
        <rect x="310" y="300" width="160" height="32" rx="16" fill="#172B25" />
        <rect x="310" y="380" width="240" height="32" rx="16" fill="#172B25" />
        <rect x="310" y="460" width="200" height="32" rx="16" fill="#172B25" />
        <rect x="470" y="650" width="56" height="130" rx="14" fill="#166B50" />
        <rect x="546" y="570" width="56" height="210" rx="14" fill="#166B50" />
        <rect x="622" y="490" width="56" height="290" rx="14" fill="#166B50" />
        <path
          d="M 140 700 C 100 850, 260 950, 460 910 C 660 870, 820 700, 840 510 C 844 470, 800 470, 790 510 C 750 680, 580 820, 390 830 C 260 836, 170 770, 190 690 C 196 660, 150 660, 140 700 Z"
          fill="url(#horizSwooshInline)"
        />
      </g>
      <g transform="translate(560, 315)">
        <text
          fontFamily="'Inter', -apple-system, sans-serif"
          fontWeight="800"
          fontSize="230"
          letterSpacing="-4"
        >
          <tspan fill="#172B25">Invo</tspan>
          <tspan fill="#166B50">Desk</tspan>
        </text>
      </g>
      <line x1="565" y1="398" x2="665" y2="398" stroke="#166B50" strokeWidth="5" strokeLinecap="round" />
      <text
        x="690"
        y="408"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontWeight="700"
        fontSize="31"
        letterSpacing="6.5"
        fill="#64746C"
      >
        GST BILLING &amp; BUSINESS OPERATIONS
      </text>
      <line x1="1540" y1="398" x2="1640" y2="398" stroke="#166B50" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
};
