import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/integrations/ga4/callback — Google Analytics OAuth 콜백
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam || !code || !state) {
    return NextResponse.redirect(new URL('/portal/settings?error=ga4_denied', request.url));
  }

  try {
    const { propertyId, uid } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // 토큰 교환
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/integrations/ga4/callback`,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/portal/settings?error=ga4_token_failed', request.url));
    }

    const tokenData = await tokenRes.json();

    // GA4 속성 목록 가져오기 (선택적)
    let accountName = '';
    try {
      const accountsRes = await fetch(
        'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
        { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
      );
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        const firstAccount = accountsData.accountSummaries?.[0];
        accountName = firstAccount?.displayName || '';
      }
    } catch {
      // 계정 이름 가져오기 실패는 무시
    }

    // Firestore에 저장
    const db = getAdminFirestore();
    const now = Timestamp.now();

    await db.collection('properties').doc(propertyId)
      .collection('integrations').doc('ga4').set({
        platform: 'ga4',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + (tokenData.expires_in || 3600) * 1000)),
        status: 'active',
        accountId: '',
        accountName,
        scope: tokenData.scope || '',
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.redirect(new URL('/portal/settings?success=ga4', request.url));
  } catch (error) {
    console.error('GA4 callback error:', error);
    return NextResponse.redirect(new URL('/portal/settings?error=ga4_failed', request.url));
  }
}
