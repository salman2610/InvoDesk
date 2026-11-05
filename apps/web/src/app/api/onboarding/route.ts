import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const businessName = body.businessName || 'Retail Store';
    const email = body.email || 'trial@invodesk.in';
    const ownerName = body.owner?.name || 'Store Owner';
    const stateCode = body.stateCode || '27';
    const stateName = body.stateName || 'Maharashtra';

    const tenantId = `tenant_${Date.now()}`;
    const branchId = `branch_${Date.now()}`;
    const terminalCode = `TRM-${Math.floor(100 + Math.random() * 900)}`;

    const trialDurationMs = 7 * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(Date.now() + trialDurationMs).toISOString();

    // Generate a valid trial JWT token for 7 days
    const mockPayload = {
      tenantId,
      branchId,
      terminalCode,
      email,
      name: ownerName,
      role: 'OWNER',
      planTier: 'STARTER_TRIAL',
      trialExpiresAt: trialEndsAt
    };

    const token = `invodesk_trial_${Buffer.from(JSON.stringify(mockPayload)).toString('base64')}`;

    return NextResponse.json(
      {
        success: true,
        message: '7-Day Free Week Pass activated successfully',
        token,
        tenant: {
          id: tenantId,
          name: businessName,
          stateCode,
          stateName
        },
        branch: {
          id: branchId,
          name: `${businessName} Main Branch`,
          code: 'STR-01'
        },
        terminal: {
          terminalCode
        },
        subscription: {
          planTier: 'STARTER_TRIAL',
          status: 'TRIALING',
          trialEndsAt
        }
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to initialize 7-day trial pass' },
      { status: 400 }
    );
  }
}
