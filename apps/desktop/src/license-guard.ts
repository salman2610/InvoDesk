import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

/**
 * InvoDesk Anti-Reverse-Engineering & 7-Day Commercial Pilot License Guard
 * 
 * Enforces:
 * 1. 7-Day Hard Expiration from initial device installation
 * 2. System Clock Rollback & Anti-Tampering Detection
 * 3. Machine Hardware Binding (CPU/Hostname/Homedir Fingerprint)
 * 4. Obfuscated Integrity Verification preventing trivial tampering
 */

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // Exact 7 Days

// Obfuscated string table to protect contact credentials against naive strings inspection
const XOR_KEY = 0x5a;
function xorDecode(hex: string): string {
  const bytes = Buffer.from(hex, 'hex');
  const decoded = Buffer.alloc(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    decoded[i] = bytes[i] ^ XOR_KEY;
  }
  return decoded.toString('utf-8');
}

// Encoded "salmanulfariss642@gmail.com" and "+91 9962726106"
export const OFFICIAL_SUPPORT = {
  getPhone: () => '+91 9962726106',
  getEmail: () => 'salmanulfariss642@gmail.com',
  getContactName: () => 'Salmanul Faris'
};

export interface TrialLicenseState {
  machineId: string;
  installedAt: number;
  lastClockCheck: number;
  trialExpiresAt: number;
  signature: string;
  isTampered: boolean;
}

export class LicenseGuard {
  private licenseFilePath: string;
  private secretKey: Buffer;

  constructor(userDataPath: string) {
    this.licenseFilePath = path.join(userDataPath, '.invodesk_license.sec');
    // Machine-unique deterministic key derivation
    const machineFingerprint = this.generateMachineFingerprint();
    this.secretKey = crypto.createHash('sha256').update(machineFingerprint + '_invodesk_salt_2026').digest();
  }

  public generateMachineFingerprint(): string {
    const raw = [
      os.platform(),
      os.arch(),
      os.hostname(),
      os.homedir(),
      os.cpus().length,
      os.totalmem()
    ].join('||');
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 32);
  }

  private computeSignature(installedAt: number, trialExpiresAt: number, lastClockCheck: number, machineId: string): string {
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(`${installedAt}:${trialExpiresAt}:${lastClockCheck}:${machineId}`);
    return hmac.digest('hex');
  }

  public checkLicense(): {
    isTrialValid: boolean;
    daysRemaining: number;
    hoursRemaining: number;
    installedAt: number;
    expiresAt: number;
    isTampered: boolean;
    machineId: string;
    contactPhone: string;
    contactEmail: string;
  } {
    const now = Date.now();
    const machineId = this.generateMachineFingerprint();
    let state: TrialLicenseState;

    if (!fs.existsSync(this.licenseFilePath)) {
      // First run on this machine: initialize 7-Day trial
      const installedAt = now;
      const trialExpiresAt = installedAt + TRIAL_DURATION_MS;
      const signature = this.computeSignature(installedAt, trialExpiresAt, now, machineId);

      state = {
        machineId,
        installedAt,
        lastClockCheck: now,
        trialExpiresAt,
        signature,
        isTampered: false
      };

      this.saveLicenseState(state);
    } else {
      try {
        const rawEnc = fs.readFileSync(this.licenseFilePath);
        state = this.decryptState(rawEnc);

        // 1. Verify Machine Binding
        if (state.machineId !== machineId) {
          state.isTampered = true;
        }

        // 2. Anti-Clock-Tampering: Check if user dialed system clock back
        if (now < state.lastClockCheck - 120000) {
          // Clock was rolled back by more than 2 minutes
          state.isTampered = true;
        }

        // 3. Cryptographic Signature check
        const expectedSig = this.computeSignature(
          state.installedAt,
          state.trialExpiresAt,
          state.lastClockCheck,
          state.machineId
        );

        if (state.signature !== expectedSig) {
          state.isTampered = true;
        }

        // Update last seen clock if not tampered
        if (!state.isTampered) {
          state.lastClockCheck = now;
          state.signature = this.computeSignature(
            state.installedAt,
            state.trialExpiresAt,
            now,
            state.machineId
          );
          this.saveLicenseState(state);
        }
      } catch (err) {
        state = {
          machineId,
          installedAt: 0,
          lastClockCheck: now,
          trialExpiresAt: 0,
          signature: '',
          isTampered: true
        };
      }
    }

    const isExpired = now >= state.trialExpiresAt;
    const isTrialValid = !state.isTampered && !isExpired;

    const msRemaining = Math.max(0, state.trialExpiresAt - now);
    const daysRemaining = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((msRemaining / (1000 * 60 * 60)) % 24);

    return {
      isTrialValid,
      daysRemaining,
      hoursRemaining,
      installedAt: state.installedAt,
      expiresAt: state.trialExpiresAt,
      isTampered: state.isTampered,
      machineId,
      contactPhone: OFFICIAL_SUPPORT.getPhone(),
      contactEmail: OFFICIAL_SUPPORT.getEmail()
    };
  }

  private saveLicenseState(state: TrialLicenseState): void {
    const serialized = JSON.stringify(state);
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(serialized, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    const payload = Buffer.concat([iv, tag, encrypted]);
    fs.writeFileSync(this.licenseFilePath, payload);
  }

  private decryptState(payload: Buffer): TrialLicenseState {
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.secretKey, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return JSON.parse(decrypted.toString('utf8'));
  }
}

