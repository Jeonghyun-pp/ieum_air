import { NextRequest, NextResponse } from 'next/server';
import { verifyCronSecret } from '@/lib/auth/middleware';
import { refreshAllExpiringTokens } from '@/lib/integrations/token-refresh';

// POST /api/cron/refresh-tokens — 일 1회 만료 임박 토큰 갱신
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  try {
    const result = await refreshAllExpiringTokens();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Token refresh cron error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed' } },
      { status: 500 }
    );
  }
}
