import { PrinterConnectionType, PrinterStatus } from '@invodesk/types';

export interface PrinterTransport {
  type: PrinterConnectionType;
  isConnected(): boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  getStatus(): Promise<PrinterStatus>;
}

export interface QueuedPrintJob {
  id: string;
  data: Uint8Array;
  description: string;
  createdAt: number;
  attempts: number;
  maxAttempts: number;
}

/**
 * Universal POS Thermal Printer Manager with Retry, Recovery, and Fallbacks
 */
export class PrinterManager {
  private transport: PrinterTransport;
  private queue: QueuedPrintJob[] = [];
  private isProcessing = false;
  private maxRetries: number;
  private baseBackoffMs: number;

  constructor(transport: PrinterTransport, maxRetries = 3, baseBackoffMs = 1000) {
    this.transport = transport;
    this.maxRetries = maxRetries;
    this.baseBackoffMs = baseBackoffMs;
  }

  public getTransport(): PrinterTransport {
    return this.transport;
  }

  public setTransport(transport: PrinterTransport): void {
    this.transport = transport;
  }

  public async getStatus(): Promise<PrinterStatus> {
    try {
      return await this.transport.getStatus();
    } catch (err: any) {
      return {
        isOnline: false,
        paperStatus: 'OUT',
        coverOpen: false,
        lastError: err.message || 'Printer unreachable'
      };
    }
  }

  /**
   * Enqueue a receipt for printing with automatic retry and recovery
   */
  public async print(data: Uint8Array, description = 'POS Receipt'): Promise<{ success: boolean; jobId: string }> {
    const job: QueuedPrintJob = {
      id: `print_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      data,
      description,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: this.maxRetries
    };

    this.queue.push(job);
    this.processQueue(); // asynchronous execution without blocking caller

    return { success: true, jobId: job.id };
  }

  /**
   * Print synchronously, throwing if failed after all retries
   */
  public async printImmediate(data: Uint8Array, description = 'POS Receipt'): Promise<void> {
    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        if (!this.transport.isConnected()) {
          await this.transport.connect();
        }

        const status = await this.transport.getStatus();
        if (status.paperStatus === 'OUT') {
          throw new Error('Printer is out of paper');
        }
        if (status.coverOpen) {
          throw new Error('Printer cover is open');
        }

        await this.transport.send(data);
        return;
      } catch (err: any) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const backoff = this.baseBackoffMs * Math.pow(2, attempt - 1);
          await new Promise(res => setTimeout(res, backoff));
        }
      }
    }

    throw new Error(`Print failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    try {
      while (this.queue.length > 0) {
        const job = this.queue[0];
        job.attempts++;

        try {
          if (!this.transport.isConnected()) {
            await this.transport.connect();
          }

          const status = await this.transport.getStatus();
          if (status.paperStatus === 'OUT' || status.coverOpen || !status.isOnline) {
            throw new Error(`Printer offline or ready error: paper=${status.paperStatus}, coverOpen=${status.coverOpen}`);
          }

          await this.transport.send(job.data);
          this.queue.shift(); // Successfully sent, pop from queue
        } catch (err: any) {
          if (job.attempts >= job.maxAttempts) {
            // Drop or alert, don't stall queue indefinitely
            console.error(`[PrinterManager] Job ${job.id} (${job.description}) failed after max attempts:`, err);
            this.queue.shift();
          } else {
            // Wait backoff before trying again
            const backoff = this.baseBackoffMs * Math.pow(2, job.attempts - 1);
            await new Promise(res => setTimeout(res, backoff));
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue = [];
  }
}
