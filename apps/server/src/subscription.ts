import { PlanEntitlements, SubscriptionPlanTier, TenantSubscription } from '@invodesk/types';
import { prisma } from '@invodesk/database';

export const PLAN_ENTITLEMENTS: Record<SubscriptionPlanTier, PlanEntitlements> = {
  STARTER_TRIAL: {
    maxBranches: 1,
    maxTerminals: 2,
    maxUsers: 3,
    maxProducts: 250,
    gstr1Export: true,
    multiWarehouse: false,
    auditLogs: false
  },
  GROWTH: {
    maxBranches: 3,
    maxTerminals: 6,
    maxUsers: 10,
    maxProducts: 2500,
    gstr1Export: true,
    multiWarehouse: true,
    auditLogs: true
  },
  ENTERPRISE: {
    maxBranches: 50,
    maxTerminals: 200,
    maxUsers: 250,
    maxProducts: 100000,
    gstr1Export: true,
    multiWarehouse: true,
    auditLogs: true
  }
};

export async function getTenantSubscriptionDetails(tenantId: string): Promise<TenantSubscription> {
  let sub = await prisma.subscription.findUnique({
    where: { tenantId }
  });

  if (!sub) {
    // Auto-initialize 14-day trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    sub = await prisma.subscription.create({
      data: {
        tenantId,
        planTier: 'STARTER_TRIAL',
        billingCycle: 'TRIAL',
        status: 'TRIALING',
        trialEndsAt: trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd
      }
    });
  }

  // Check expiration
  const now = new Date();
  let currentStatus = sub.status;
  if (sub.status === 'TRIALING' && sub.trialEndsAt && now > sub.trialEndsAt) {
    currentStatus = 'EXPIRED';
  } else if (sub.status === 'ACTIVE' && now > sub.currentPeriodEnd) {
    currentStatus = 'PAST_DUE';
  }

  const tier = (sub.planTier as SubscriptionPlanTier) || 'STARTER_TRIAL';
  const entitlements = PLAN_ENTITLEMENTS[tier] || PLAN_ENTITLEMENTS.STARTER_TRIAL;

  const [branchesCount, terminalsCount, usersCount, productsCount] = await Promise.all([
    prisma.branch.count({ where: { tenantId } }),
    prisma.terminal.count({ where: { tenantId, isActive: true } }),
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.product.count({ where: { tenantId, isActive: true } })
  ]);

  return {
    tenantId,
    planTier: tier,
    billingCycle: sub.billingCycle as any,
    status: currentStatus as any,
    trialStartsAt: sub.createdAt.toISOString(),
    trialEndsAt: sub.trialEndsAt ? sub.trialEndsAt.toISOString() : undefined,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cancelledAt: sub.cancelledAt ? sub.cancelledAt.toISOString() : undefined,
    paymentProvider: (sub.paymentProvider as any) || undefined,
    externalSubscriptionId: sub.externalSubscriptionId || undefined,
    entitlements,
    usage: {
      branchesCount,
      terminalsCount,
      usersCount,
      productsCount
    }
  };
}

export async function assertEntitlement(
  tenantId: string,
  metric: 'maxBranches' | 'maxTerminals' | 'maxUsers' | 'maxProducts'
): Promise<void> {
  const sub = await getTenantSubscriptionDetails(tenantId);

  if (sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
    throw new Error(`Subscription is ${sub.status}. Please upgrade or renew your plan to continue.`);
  }

  const limit = sub.entitlements[metric];
  let current = 0;
  switch (metric) {
    case 'maxBranches':
      current = sub.usage.branchesCount;
      break;
    case 'maxTerminals':
      current = sub.usage.terminalsCount;
      break;
    case 'maxUsers':
      current = sub.usage.usersCount;
      break;
    case 'maxProducts':
      current = sub.usage.productsCount;
      break;
  }

  if (current >= limit) {
    throw new Error(
      `Plan entitlement limit reached for ${metric} (Current: ${current}, Limit: ${limit}). Upgrade to Growth or Enterprise.`
    );
  }
}

