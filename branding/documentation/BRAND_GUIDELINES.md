# InvoDesk — Official Brand Identity & Design System Guidelines

## 1. Brand Overview
**InvoDesk** is a modern, offline-first GST Billing, Retail POS Counter, Inventory Management, and Khata Ledger platform built for retail stores, supermarkets, and B2B distributors.

The visual identity communicates **financial precision, speed at the checkout counter, and trustworthy compliance** through an invoice-and-growth emblem paired with a clean emerald-and-graphite color system.

---

## 2. Official Color Palette

InvoDesk uses a **Light-First** design system optimized for bright retail checkout counters, paired with an optional **Charcoal Dark Theme** for low-light environments.

### Core Brand & Light Theme Tokens (Default)
| Token Name | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Emerald** | `--brand-emerald` | `#166B50` | Primary buttons, active navigation tabs, brand wordmark ("Desk"), borders, focus rings |
| **Accent Green** | `--brand-accent` | `#22C55E` | Logo fold/swoosh highlights, online status indicators, positive financial metrics |
| **Main Text (Graphite)** | `--text-main` | `#172B25` | Primary headings, body copy, table values, "Invo" wordmark on light surfaces |
| **Secondary Text** | `--text-secondary` | `#64746C` | Subtitles, form labels, table column headers, secondary metadata |
| **Muted Text** | `--text-muted` | `#8FA097` | Input placeholders, disabled states, timestamps |
| **Primary Background** | `--bg-primary` | `#F5F7F6` | Application canvas background |
| **Surface / Card** | `--bg-secondary` / `--bg-card` | `#FFFFFF` | Cards, modals, tables, form inputs, navbar surface |
| **Tertiary Surface** | `--bg-tertiary` | `#EEF2F0` | Table headers, segmented control backgrounds, subtle wells |

### Optional Dark Theme Tokens (`[data-theme="dark"]`)
| Token Name | CSS Variable | Hex Value | Usage |
| :--- | :--- | :--- | :--- |
| **Charcoal Canvas** | `--bg-primary` | `#0D1612` | Deep charcoal background with subtle forest undertone |
| **Dark Surface / Card** | `--bg-secondary` / `--bg-card` | `#13221C` | Elevated panels, cards, and modals |
| **Dark Tertiary** | `--bg-tertiary` | `#192C24` | Input wells, table headers, secondary containers |
| **Dark Main Text** | `--text-main` | `#F5F7F6` | High-contrast off-white typography |
| **Dark Secondary Text** | `--text-secondary` | `#9EB3A8` | Muted sage-gray secondary labels |

---

## 3. Typography

- **Primary UI & Body Font:** `Inter` (`300`, `400`, `500`, `600`, `700`, `800`, `900`)
  - Used for all POS item tables, tax breakdowns, SKU codes, and form controls for maximum legibility at small sizes.
- **Display & Heading Font:** `Outfit` (`600`, `700`, `800`)
  - Used for executive KPI values, grand totals, and section headers.
- **Monospace Font:** `Courier New` / system monospace
  - Used for 80mm/58mm ESC/POS thermal receipt previews, HSN codes, GSTINs, and client transaction IDs.

---

## 4. Logo System & Asset Inventory

All master vector (`.svg`) and high-resolution raster (`.png`) brand assets are stored under `/branding/` and mirrored to `/apps/web/public/branding/` and `/apps/desktop/build/`.

### A. Logos (`/branding/logos/`)
| Asset File | Format & Dimensions | Description & Usage |
| :--- | :--- | :--- |
| `invodesk-logo-horizontal.svg` / `.png` | SVG & PNG (`2048×512`) | **Primary Horizontal Logo** for light backgrounds, navbar, login, and A4 tax invoices |
| `invodesk-logo-dark.svg` / `.png` | SVG & PNG (`2048×512`) | **Dark Mode Horizontal Logo** with white "Invo" and `#22C55E` "Desk" on transparent background |
| `invodesk-logo-dark-boxed.svg` / `.png` | SVG & PNG (`2048×512`) | Dark mode horizontal logo on a `#062219` rounded card |
| `invodesk-logo-vertical.svg` / `.png` | SVG & PNG (`1024×1024`) | **Stacked Vertical Logo** for splash screens, square cards, and onboarding |
| `invodesk-logo-monochrome.svg` / `.png` | SVG & PNG (`2048×512`) | **Single-Color Monochrome Logo** (`#172B25`) for laser/thermal print and embossing |
| `invodesk-mark.svg` / `.png` | SVG & PNG (`1024×1024`) | **Standalone Brand Mark** (invoice + rising bar chart + orbital swoosh) for compact mobile headers |
| `invodesk-mark-mono.svg` / `.png` | SVG & PNG (`1024×1024`) | **Monochrome Brand Mark** for 58mm/80mm thermal receipt headers |

### B. Desktop & Mobile Application Icons (`/branding/icons/`)
| Asset File | Dimensions | Target Platform |
| :--- | :--- | :--- |
| `app-icon.svg` | Vector (`1024×1024`) | Master squircle icon with emerald gradient (`#166B50` to `#093526`) |
| `app-icon-1024.png` … `app-icon-16.png` | `1024`, `512`, `256`, `128`, `64`, `48`, `32`, `16` px | Multi-resolution PNG icon set for Linux/Electron (`apps/desktop/build/icons/`) |
| `icon.ico` | Multi-size (`16`–`256` px) | Windows executable & installer icon (`apps/desktop/build/icon.ico`) |
| `icon.icns` | macOS ICNS bundle | macOS application bundle icon (`apps/desktop/build/icon.icns`) |
| `invodesk-pos.desktop` | Linux Desktop Entry | Freedesktop `.desktop` launcher specification |

### C. Web Favicons & PWA Manifest (`/branding/favicons/` & `/apps/web/public/`)
| Asset File | Dimensions | Purpose |
| :--- | :--- | :--- |
| `favicon.ico` | `16×16`, `32×32`, `48×48` | Legacy & standard browser tab icon |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | `16×16`, `32×32`, `48×48` | Crisp PNG browser favicons |
| `apple-touch-icon.png` | `180×180` | iOS / iPadOS home screen icon |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | `192×192`, `512×512` | Android PWA & maskable launcher icons |
| `site.webmanifest` | JSON Web Manifest | Configures standalone PWA display, `#166B50` theme color, and `#F5F7F6` background |

### D. Marketing & OpenGraph Banner (`/branding/banners/`)
| Asset File | Dimensions | Purpose |
| :--- | :--- | :--- |
| `invodesk-banner.svg` / `invodesk-banner-1920x640.png` | `1920×640` (3:1) | Hero banner featuring the InvoDesk dark logo and vector POS hardware illustrations (thermal printer, POS terminal monitor, handheld barcode scanner) |

---

## 5. Logo Usage & Clear Space Rules
1. **Minimum Clear Space:** Maintain a minimum padding around the horizontal logo equal to `25%` of the mark's height on all sides.
2. **Responsive Collapse:** On viewports narrower than `640px`, collapse the full horizontal wordmark (`invodesk-logo-horizontal`) to the standalone icon mark (`invodesk-mark`) to preserve navigation space.
3. **Thermal Printing:** Use `invodesk-mark-mono` or `invodesk-logo-monochrome` on 1-bit black-and-white thermal paper receipts to avoid halftone dithering.
4. **Do Not:**
   - Do not alter the aspect ratio or stretch the SVG viewBox.
   - Do not render the dark-text logo (`#172B25`) on dark charcoal backgrounds; always switch to the `dark` variant (`BrandLogo variant="dark"`).

