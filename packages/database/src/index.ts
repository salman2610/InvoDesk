import { PrismaClient, Prisma } from '@prisma/client';

export * from '@prisma/client';

// Ensure Prisma Decimal serializes to JSON as a standard numeric representation
(Prisma.Decimal.prototype as any).toJSON = function () {
  return Number(this.toString());
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

/**
 * Re-establishes connection pool with PostgreSQL after server restart or connection interruption
 */
export async function reconnectPrisma(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch {}
  await prisma.$connect();
}

/**
 * Calculates current Indian Financial Year string (e.g. "26-27")
 * April 1 to March 31 cycle
 */
export function getCurrentFinancialYear(date = new Date()): string {
  const month = date.getMonth(); // 0 is January, 3 is April
  const year = date.getFullYear();
  if (month >= 3) {
    const nextYearShort = (year + 1).toString().slice(-2);
    return `${year.toString().slice(-2)}-${nextYearShort}`;
  } else {
    const prevYearShort = (year - 1).toString().slice(-2);
    return `${prevYearShort}-${year.toString().slice(-2)}`;
  }
}

/**
 * Atomically allocates the next sequential invoice number for a branch within a financial year.
 * In PostgreSQL, uses atomic upsert & increment with tenant isolation.
 */
export async function getNextInvoiceSequence(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  branchId: string,
  tenantId: string,
  branchCode: string,
  date = new Date()
): Promise<{ sequenceNumber: number; invoiceNumber: string; financialYear: string }> {
  const financialYear = getCurrentFinancialYear(date);

  // Atomic upsert and increment on invoice sequence with tenant isolation
  const seqRecord = await tx.invoiceSequence.upsert({
    where: {
      tenantId_branchId_financialYear: {
        tenantId,
        branchId,
        financialYear
      }
    },
    update: {
      lastSequence: {
        increment: 1
      }
    },
    create: {
      tenantId,
      branchId,
      financialYear,
      lastSequence: 1
    }
  });

  const paddedSeq = seqRecord.lastSequence.toString().padStart(4, '0');
  const invoiceNumber = `INV/${branchCode}/${financialYear}/${paddedSeq}`;

  return {
    sequenceNumber: seqRecord.lastSequence,
    invoiceNumber,
    financialYear
  };
}
