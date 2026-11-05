import { CashierShift, CashDropEntry } from '@invodesk/types';

export class CashierShiftManager {
  private activeShift: CashierShift | null = null;
  private drops: CashDropEntry[] = [];
  private shiftHistory: CashierShift[] = [];

  /**
   * Start a new cashier counter shift with an opening cash float
   */
  public openShift(
    tenantId: string,
    branchId: string,
    userId: string,
    userName: string,
    openingFloat: number,
    notes?: string
  ): CashierShift {
    if (this.activeShift && this.activeShift.status === 'OPEN') {
      throw new Error(`An active shift is already open for cashier "${this.activeShift.userName}" (Shift ID: ${this.activeShift.id})`);
    }

    const shift: CashierShift = {
      id: `shift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      branchId,
      userId,
      userName,
      openedAt: new Date().toISOString(),
      openingFloat,
      cashSalesTotal: 0,
      cashReturnsTotal: 0,
      cashDropsTotal: 0,
      expectedCash: openingFloat,
      status: 'OPEN',
      totalTransactionsCount: 0,
      notes
    };

    this.activeShift = shift;
    this.drops = [];
    return shift;
  }

  public getActiveShift(): CashierShift | null {
    return this.activeShift ? { ...this.activeShift } : null;
  }

  /**
   * Record a cash sale transaction during the shift
   */
  public recordCashSale(amount: number): void {
    if (!this.activeShift || this.activeShift.status !== 'OPEN') {
      throw new Error('Cannot record transaction: No open cashier shift');
    }

    this.activeShift.cashSalesTotal += amount;
    this.activeShift.totalTransactionsCount += 1;
    this.activeShift.expectedCash =
      this.activeShift.openingFloat +
      this.activeShift.cashSalesTotal -
      this.activeShift.cashReturnsTotal -
      this.activeShift.cashDropsTotal;
  }

  /**
   * Record a cash return / refund to a customer
   */
  public recordCashReturn(amount: number): void {
    if (!this.activeShift || this.activeShift.status !== 'OPEN') {
      throw new Error('Cannot record refund: No open cashier shift');
    }

    this.activeShift.cashReturnsTotal += amount;
    this.activeShift.expectedCash =
      this.activeShift.openingFloat +
      this.activeShift.cashSalesTotal -
      this.activeShift.cashReturnsTotal -
      this.activeShift.cashDropsTotal;
  }

  /**
   * Perform a mid-shift cash drop (e.g. skimming excess cash into the back-office safe)
   */
  public recordCashDrop(amount: number, reason: string, type: 'DROP' | 'PAYOUT' = 'DROP'): CashDropEntry {
    if (!this.activeShift || this.activeShift.status !== 'OPEN') {
      throw new Error('Cannot record cash drop: No open cashier shift');
    }

    const entry: CashDropEntry = {
      id: `drop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      shiftId: this.activeShift.id,
      type,
      amount,
      reason,
      timestamp: Date.now()
    };

    this.drops.push(entry);
    this.activeShift.cashDropsTotal += amount;
    this.activeShift.expectedCash =
      this.activeShift.openingFloat +
      this.activeShift.cashSalesTotal -
      this.activeShift.cashReturnsTotal -
      this.activeShift.cashDropsTotal;

    return entry;
  }

  /**
   * End the cashier shift with physical cash tally and discrepancy calculation (Z-Report)
   */
  public closeShift(actualCashCounted: number, notes?: string): CashierShift {
    if (!this.activeShift || this.activeShift.status !== 'OPEN') {
      throw new Error('No open shift to close');
    }

    const expected =
      this.activeShift.openingFloat +
      this.activeShift.cashSalesTotal -
      this.activeShift.cashReturnsTotal -
      this.activeShift.cashDropsTotal;

    const diff = actualCashCounted - expected;

    const closed: CashierShift = {
      ...this.activeShift,
      closedAt: new Date().toISOString(),
      expectedCash: expected,
      actualCashCounted,
      cashDifference: Number(diff.toFixed(2)),
      status: 'CLOSED',
      notes: notes || this.activeShift.notes
    };

    this.shiftHistory.push(closed);
    this.activeShift = null;
    return closed;
  }

  public getDrops(): CashDropEntry[] {
    return [...this.drops];
  }

  public getHistory(): CashierShift[] {
    return [...this.shiftHistory];
  }
}
