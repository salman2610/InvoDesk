import { PrinterPaperWidth } from '@invodesk/types';

export class EscPosEncoder {
  private buffer: number[] = [];
  private paperWidth: PrinterPaperWidth;
  private maxCharsPerLine: number;

  constructor(paperWidth: PrinterPaperWidth = '80mm') {
    this.paperWidth = paperWidth;
    this.maxCharsPerLine = paperWidth === '58mm' ? 32 : 48;
    this.initialize();
  }

  public initialize(): this {
    this.buffer.push(0x1b, 0x40); // ESC @
    return this;
  }

  public alignLeft(): this {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  public alignCenter(): this {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  public alignRight(): this {
    this.buffer.push(0x1b, 0x61, 0x02); // ESC a 2
    return this;
  }

  public bold(enable = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  public underline(enable = true): this {
    this.buffer.push(0x1b, 0x2d, enable ? 0x01 : 0x00); // ESC - n
    return this;
  }

  public inverted(enable = true): this {
    this.buffer.push(0x1d, 0x42, enable ? 0x01 : 0x00); // GS B n
    return this;
  }

  public doubleSize(enable = true): this {
    // GS ! n (0x11 = double height + width, 0x00 = normal)
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  public text(str: string): this {
    // Replace Indian Rupee symbol with 'Rs.' if printer doesn't support glyph
    const sanitized = str.replace(/₹/g, 'Rs.');
    for (let i = 0; i < sanitized.length; i++) {
      const code = sanitized.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 0x3f); // ASCII or fallback '?'
    }
    return this;
  }

  public line(str = ''): this {
    if (str) this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  public newline(count = 1): this {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  public separator(char = '-'): this {
    this.line(char.repeat(this.maxCharsPerLine));
    return this;
  }

  /**
   * Format two columns aligned to left and right edges
   */
  public twoColumns(leftText: string, rightText: string): this {
    const spaceCount = Math.max(1, this.maxCharsPerLine - leftText.length - rightText.length);
    this.line(leftText + ' '.repeat(spaceCount) + rightText);
    return this;
  }

  /**
   * Format item row (Name, Qty, Rate, Amount)
   */
  public itemRow(name: string, qty: number, rate: number, total: number): this {
    if (this.paperWidth === '58mm') {
      // 58mm compact format: 32 columns
      // Line 1: Item name (truncated if > 32)
      this.line(name.substring(0, 32));
      // Line 2: "  2 x Rs.100.00        Rs.200.00"
      const details = `  ${qty} x ${rate.toFixed(2)}`;
      const totalStr = total.toFixed(2);
      const spaces = Math.max(1, 32 - details.length - totalStr.length);
      this.line(details + ' '.repeat(spaces) + totalStr);
    } else {
      // 80mm standard format: 48 columns
      // Name: 22 chars, Qty: 6 chars, Rate: 10 chars, Total: 10 chars
      const nameCol = name.padEnd(22).substring(0, 22);
      const qtyCol = String(qty).padStart(6);
      const rateCol = rate.toFixed(2).padStart(10);
      const totalCol = total.toFixed(2).padStart(10);
      this.line(nameCol + qtyCol + rateCol + totalCol);
    }
    return this;
  }

  /**
   * Pulse cash drawer kick-out pin
   * Pin 2: 0x00, Pin 5: 0x01
   * t1 = 50ms (0x19), t2 = 500ms (0xFA)
   */
  public kickCashDrawer(pin: 2 | 5 = 2): this {
    const pinByte = pin === 2 ? 0x00 : 0x01;
    this.buffer.push(0x1b, 0x70, pinByte, 0x19, 0xfa);
    return this;
  }

  /**
   * Paper cut command (Feed and partial or full cut)
   */
  public cut(partial = true): this {
    this.newline(3);
    // GS V m (0x41: full cut after feed, 0x42: partial cut after feed)
    this.buffer.push(0x1d, 0x56, partial ? 0x42 : 0x41, 0x03);
    return this;
  }

  /**
   * Generate Code 128 Barcode
   */
  public barcode(code: string): this {
    this.alignCenter();
    // GS h n (Set height to 60 dots)
    this.buffer.push(0x1d, 0x68, 60);
    // GS w n (Set width module to 2)
    this.buffer.push(0x1d, 0x77, 2);
    // GS H n (Print HRI below barcode)
    this.buffer.push(0x1d, 0x48, 2);
    // GS k m d1...dk NUL (m = 73 for Code 128)
    const codeBytes = Array.from(code).map(c => c.charCodeAt(0));
    this.buffer.push(0x1d, 0x6b, 73, codeBytes.length, ...codeBytes);
    this.newline(1);
    this.alignLeft();
    return this;
  }

  /**
   * Return compiled ESC/POS byte array
   */
  public encode(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  public getRawBuffer(): number[] {
    return [...this.buffer];
  }
}
