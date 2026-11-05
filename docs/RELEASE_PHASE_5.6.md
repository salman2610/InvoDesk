# InvoDesk POS — Phase 5.6: Security Remediation & Release Certification

**Release Candidate:** v1.0.0-rc1  
**Build Target Architecture:** Linux x64 (`.deb`, `AppImage`) & Windows x64 (`.zip`, portable `.exe`)  
**Certification Date:** November 2, 2026  
**Status:** Certified Release Candidate (All 56 Automated Tests Passing)

---

## 📦 1. Production Release Artifacts & SHA-256 Checksums

| Package | Platform | Format | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- | :--- |
| **InvoDeskPOS-1.0.0-linux-amd64.deb** | Linux x64 | Debian Package | 86 MB | `6eddabfea2a481b0a4c9b3940b5ec5f181a1bd9a9fe387790351779a780a52a1` |
| **InvoDeskPOS-1.0.0-linux-x86_64.AppImage** | Linux x64 | AppImage Standalone | 120 MB | `05ad55dd4ba2d6bc5602a1c8e0f3d939f00d32cd4031ad94f21599917c8781cd` |
| **InvoDeskPOS-1.0.0-win-x64.zip** | Windows x64 | Portable Archive | 147 MB | `bf82ef9b1691b65fcdf23db896d1f4061c442f121e1b51a84d8ac661bcb2aa84` |
| **InvoDeskPOS-1.0.0-win-x64.exe** | Windows x64 | Single Portable Executable | 100 MB | `eb05074f966582e99cc198faf27f0934a172acdebb1e7fe5a2543b9f3faa2f75` |

---

## ⚡ 2. Upgraded Runtime & Build Inventory

The desktop runtime has been upgraded from end-of-support Electron 33 to currently supported **Electron 45.2.1**:

- **Electron Runtime:** `45.2.1`
- **Chromium Engine:** `156.0.8078.75`
- **Embedded Node.js:** `24.22.1`
- **V8 JavaScript Engine:** `15.6.75.25-electron.0`
- **Embedded SQLite:** `3.53.4` (native `node:sqlite` DatabaseSync bundled directly in Node 24 runtime)
- **Native Dependency Audit:** Zero external native binary recompilation failures; `node:sqlite` operates natively without `better-sqlite3` native add-ons.

---

## 🔒 3. Security Hardening & Remediation Evidence

### A. Process Isolation & WebPreferences
- `contextIsolation: true` enforced on all renderer sessions.
- `nodeIntegration: false` strictly isolates Node.js APIs from the web renderer.
- `sandbox: true` enables Chromium OS-level unprivileged process sandboxing.
- `webSecurity: true` prevents cross-origin file leakage.
- `allowRunningInsecureContent: false` strictly blocks mixed HTTP/HTTPS content.

### B. Device Permission Authorization
All intrusive web device permissions are denied by default via `session.defaultSession`:
```typescript
session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
session.defaultSession.setPermissionCheckHandler(() => false);
```
Blocked APIs: Camera, Microphone, Geolocation, System Notifications, MIDI, and Pointer Lock.

### C. WebContents & Window Restrictions
- `setWindowOpenHandler` denies all popup windows and target `_blank` child browser creations (`{ action: 'deny' }`).
- `will-attach-webview` intercepted and prevented across all webcontents.
- Top-level `will-navigate` restricted strictly to the authorized origin (`http://localhost:3000`).

### D. Hardened Content Security Policy (CSP)
CSP is strictly differentiated between production builds and local dev environments:
- **Production (`app.isPackaged || NODE_ENV === 'production'`):**
  ```text
  default-src 'self' data:;
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self' http://localhost:4000 https://api.invodesk.in;
  font-src 'self' data:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  ```
  *(Zero `'unsafe-eval'` or wildcard origins allowed in production)*.
- **Development (`NODE_ENV === 'development'`):**
  Includes `'unsafe-eval'` and `ws:` strictly to accommodate Next.js React Fast-Refresh and Turbopack dev server.

### E. IPC Channel Authorization & Payload Validation
All IPC channels enforce strict schema and type validation:
- `CONFIG_SET`: Whitelisted to 11 authorized keys (`ALLOWED_CONFIG_KEYS`), values constrained to strings <= 4096 bytes.
- `DRAWER_KICK`: Constrained to pin `0` or `1`.
- `SCANNER_INPUT`: Barcode input validated to strings <= 128 characters.
- `OUTBOX_QUEUE`: Validates entity types (`INVOICE`, `PAYMENT`, `CUSTOMER`, `SHIFT_LOG`) and actions (`CREATE`, `UPDATE`, `CANCEL`).
- `DB_RESTORE` & `DB_BACKUP`: Path traversal checks prevent escaping authorized directories.

### F. Removal of Insecure Launch Instructions
All references to `--no-sandbox` for normal execution have been eliminated. Debian packages configure `chrome-sandbox` with SUID `4755` via [after-install.sh](file:///home/sesame-ai/InvoDesk/apps/desktop/build/after-install.sh), enabling full sandboxing out of the box.

---

## 💾 4. SQLite Online Backup, WAL Recovery & Disaster Recovery

### A. Journal Mode
SQLite operates under **WAL Mode (Write-Ahead Logging)**:
```sql
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;
```
Verified via `localDb.getJournalMode()` returning `'wal'` and `localDb.checkIntegrity()` returning `ok`.

### B. Online Backup Procedure (`VACUUM INTO`)
Online backup uses SQLite's official atomic backup API (`VACUUM INTO`):
1. Creates a transactionally consistent, zero-downtime database snapshot while active POS checkouts and sync tasks proceed concurrently.
2. Applies secure user-only file permissions (`chmod 0600`) to the snapshot.
3. Exposes IPC endpoint `invodesk:db:backup` for automated scheduled daily backups.

### C. Safe Database Restore Procedure
1. **Pre-Restore Validation:** Opens backup snapshot in read-only mode to execute `PRAGMA integrity_check`.
2. **Safe Disconnect:** Checkpoints current WAL (`PRAGMA wal_checkpoint(TRUNCATE)`) and closes active connection.
3. **Stale WAL Cleanup:** Removes any active `-wal` or `-shm` files to prevent stale log page collisions.
4. **Atomic Swap:** Copies verified backup into place with `chmod 0600`.
5. **Reconnection & Post-Check:** Reconnects with WAL pragmas, reapplies schema, and confirms `PRAGMA integrity_check` is healthy.

### D. Duplicate Transaction Prevention (Server-Side Idempotency)
When an older database backup is restored containing previously pushed offline transactions:
- The sync engine pushes `clientTransactionId` to `/api/sync/push`.
- Central Fastify server verifies `tenantId_clientTransactionId` in `SyncTransaction`.
- Existing transactions are skipped without creating duplicate tax invoices or decrementing stock twice.

---

## 🛠️ 5. Installation & Execution Guide

### Linux Debian/Ubuntu (`.deb`)
```bash
# 1. Install or update package:
sudo apt-get install --reinstall -y ./apps/desktop/release/InvoDeskPOS-1.0.0-linux-amd64.deb

# 2. Launch InvoDesk POS:
invodesk-pos
```

### Linux Portable AppImage
```bash
# 1. Make executable:
chmod +x ./apps/desktop/release/InvoDeskPOS-1.0.0-linux-x86_64.AppImage

# 2. Launch:
./apps/desktop/release/InvoDeskPOS-1.0.0-linux-x86_64.AppImage
```

### Windows Portable Execution
Extract `InvoDeskPOS-1.0.0-win-x64.zip` or run `InvoDeskPOS-1.0.0-win-x64.exe` directly on Windows 10/11 64-bit.

---

## 🔌 6. Hardware Verification Matrix (Physical vs Simulated)

| Hardware Component | Verification Level | Verification Proof & Details |
| :--- | :--- | :--- |
| **USB Barcode Scanner** | **VERIFIED PHYSICAL** | Tested with physical `1a2c:2124` Semico USB Keyboard Wedge device. Fast keystroke burst capture (<40ms buffer) and rejection of slow typing validated. |
| **80mm ESC/POS Thermal Printer** | **SIMULATED ONLY** | 1,211-byte ESC/POS binary stream verified with GSTIN, 48-col tabular items, CGST/SGST breakdown, and paper cut (`GS V 0`). *No physical printer currently attached to test host.* |
| **58mm ESC/POS Thermal Printer** | **SIMULATED ONLY** | 867-byte ESC/POS binary stream verified with 32-col compact slip. *No physical printer currently attached to test host.* |
| **Network Receipt Printer (TCP 9100)** | **SIMULATED ONLY** | TCP socket retry queue and offline buffering verified. *No network printer on local LAN.* |
| **RJ11/RJ12 Cash Drawer Kick** | **SIMULATED ONLY** | ESC/POS solenoid trigger pulse (`\x1B\x70\x00\x19\xFA`) verified. *Requires printer connection.* |

---

## ⚠️ 7. Release Caveats & Known Limitations

1. **Windows Native CI Certification:**
   The Windows `.zip` archive and standalone executable were cross-compiled on Linux. While the bundle integrity, binary resources, and unpacked execution layout are valid, final native Windows Defender SmartScreen testing and Authenticode code-signing require a native Windows CI runner or hardware token.
2. **Physical Thermal Printer Verification:**
   Physical ESC/POS printing requires connecting a physical USB or Ethernet thermal printer (e.g., Epson TM-T82 or TVS RP3200) for paper cut and alignment sign-off.
3. **Database Backup Retention:**
   Automated backups created via `invodesk:db:backup` are stored in the user data directory under `backups/`. Disk storage pruning should be scheduled by operations if disk space is constrained.
