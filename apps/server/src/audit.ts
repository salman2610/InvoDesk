import { prisma } from '@invodesk/database';

export interface RecordAuditParams {
  tenantId: string;
  userId: string;
  userName: string;
  action: string;
  entityType: 'INVOICE' | 'PAYMENT' | 'PRODUCT' | 'STOCK' | 'SUBSCRIPTION' | 'AUTH' | 'TENANT';
  entityId: string;
  reason?: string;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
}

export async function recordAuditLog(params: RecordAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        reason: params.reason,
        previousState: params.previousState ? JSON.stringify(params.previousState) : null,
        newState: params.newState ? JSON.stringify(params.newState) : null,
        ipAddress: params.ipAddress
      }
    });
  } catch (err) {
    // Audit log failure shouldn't silently crash caller, but should log
    console.error('AuditLog record failure:', err);
  }
}

