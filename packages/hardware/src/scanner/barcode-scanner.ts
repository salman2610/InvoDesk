import { Product, ScanEvent, BarcodeLookupResult } from '@invodesk/types';

export type ScanListener = (event: ScanEvent) => void;
export type ProductFoundListener = (result: BarcodeLookupResult) => void;
export type UnknownBarcodeListener = (barcode: string) => void;

export interface BarcodeScannerOptions {
  maxInterCharDelayMs?: number; // Maximum delay between characters to consider it a hardware scanner (default 50ms)
  minBarcodeLength?: number; // Minimum length of valid barcode (default 3)
  terminators?: string[]; // Keys terminating a scan (default ['Enter', '\n', '\r', 'Tab'])
  stripSymbologyPrefix?: boolean; // Strip AIM identifiers e.g. ']E0', ']C1'
}

/**
 * Universal Hardware Keyboard-Wedge Barcode Scanner Engine
 * Handles microsecond consecutive scans, distinguishes hardware scanners from human typing,
 * and manages barcode registration & lookup.
 */
export class BarcodeScannerEngine {
  private buffer: string[] = [];
  private lastCharTime = 0;
  private scanStartTime = 0;
  private options: Required<BarcodeScannerOptions>;
  private scanListeners: Set<ScanListener> = new Set();
  private productFoundListeners: Set<ProductFoundListener> = new Set();
  private unknownBarcodeListeners: Set<UnknownBarcodeListener> = new Set();
  private productRegistry: Map<string, Product> = new Map();

  constructor(options: BarcodeScannerOptions = {}) {
    this.options = {
      maxInterCharDelayMs: options.maxInterCharDelayMs ?? 50,
      minBarcodeLength: options.minBarcodeLength ?? 3,
      terminators: options.terminators ?? ['Enter', '\n', '\r', 'Tab', '\t'],
      stripSymbologyPrefix: options.stripSymbologyPrefix ?? true
    };
  }

  /**
   * Register known products into the scanner's rapid in-memory lookup cache
   */
  public registerProducts(products: Product[]): void {
    for (const p of products) {
      if (p.barcode) {
        this.productRegistry.set(p.barcode.trim(), p);
      }
      this.productRegistry.set(p.sku.trim(), p);
    }
  }

  /**
   * Associate a new barcode with an existing or new product
   */
  public registerBarcode(barcode: string, product: Product): void {
    const clean = barcode.trim();
    this.productRegistry.set(clean, { ...product, barcode: clean });
  }

  /**
   * Process incoming raw keystroke character
   * Can be wired directly to window.addEventListener('keydown') in browser or stdin in CLI/Node.
   */
  public handleKeyInput(key: string, timestamp = Date.now()): { handled: boolean; completedScan?: ScanEvent } {
    const timeSinceLastChar = timestamp - this.lastCharTime;

    // Check if it is a terminator character
    if (this.options.terminators.includes(key)) {
      if (this.buffer.length >= this.options.minBarcodeLength) {
        const rawBarcode = this.buffer.join('');
        const duration = timestamp - this.scanStartTime;
        const cleanBarcode = this.normalizeBarcode(rawBarcode);

        const scanEvent: ScanEvent = {
          barcode: cleanBarcode,
          rawInput: rawBarcode,
          scanDurationMs: duration,
          timestamp
        };

        // Reset buffer for consecutive scans
        this.buffer = [];
        this.lastCharTime = 0;
        this.scanStartTime = 0;

        this.emitScan(scanEvent);
        return { handled: true, completedScan: scanEvent };
      }

      // If buffer too short, clear
      this.buffer = [];
      return { handled: false };
    }

    // Filter out control keys (Shift, Alt, Control, Meta)
    if (key.length > 1 && !key.startsWith('\\')) {
      return { handled: false };
    }

    // Inter-character timing check:
    // If the delay between characters exceeds the scanner threshold,
    // this was either human typing or a new barcode scan. Reset the buffer.
    if (this.buffer.length > 0 && timeSinceLastChar > this.options.maxInterCharDelayMs) {
      this.buffer = [];
    }

    if (this.buffer.length === 0) {
      this.scanStartTime = timestamp;
    }

    this.buffer.push(key);
    this.lastCharTime = timestamp;

    return { handled: true };
  }

  /**
   * Programmatically simulate a complete hardware scan (for automated testing or direct serial scan)
   */
  public simulateHardwareScan(barcode: string, interCharDelayMs = 5): ScanEvent {
    let now = Date.now();
    for (const char of barcode) {
      this.handleKeyInput(char, now);
      now += interCharDelayMs;
    }
    const res = this.handleKeyInput('Enter', now);
    return res.completedScan!;
  }

  /**
   * Strip symbology AIM identifiers if present (e.g. "]C1" for Code 128, "]e0" for EAN/UPC)
   */
  private normalizeBarcode(raw: string): string {
    let cleaned = raw.trim();
    if (this.options.stripSymbologyPrefix && cleaned.startsWith(']')) {
      cleaned = cleaned.substring(3);
    }
    return cleaned;
  }

  private emitScan(event: ScanEvent): void {
    this.scanListeners.forEach(listener => listener(event));

    // Perform barcode lookup
    const product = this.productRegistry.get(event.barcode);
    const lookupResult: BarcodeLookupResult = {
      found: !!product,
      product,
      barcode: event.barcode,
      requiresRegistration: !product
    };

    if (product) {
      this.productFoundListeners.forEach(listener => listener(lookupResult));
    } else {
      this.unknownBarcodeListeners.forEach(listener => listener(event.barcode));
    }
  }

  public onScan(listener: ScanListener): () => void {
    this.scanListeners.add(listener);
    return () => this.scanListeners.delete(listener);
  }

  public onProductFound(listener: ProductFoundListener): () => void {
    this.productFoundListeners.add(listener);
    return () => this.productFoundListeners.delete(listener);
  }

  public onUnknownBarcode(listener: UnknownBarcodeListener): () => void {
    this.unknownBarcodeListeners.add(listener);
    return () => this.unknownBarcodeListeners.delete(listener);
  }

  public lookup(barcode: string): BarcodeLookupResult {
    const clean = barcode.trim();
    const product = this.productRegistry.get(clean);
    return {
      found: !!product,
      product,
      barcode: clean,
      requiresRegistration: !product
    };
  }

  public clearBuffer(): void {
    this.buffer = [];
    this.lastCharTime = 0;
    this.scanStartTime = 0;
  }
}
