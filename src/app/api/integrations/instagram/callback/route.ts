import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET /api/integrations/instagram/callback — Instagram OAuth 콜백
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam || !code || !state) {
    return NextResponse.redirect(new URL('/portal/settings?error=instagram_denied', request.url));
  }

  try {
    // state 디코딩
    const { propertyId, uid } = JSON.parse(Buffer.from(state, 'base64url').toString());

    // 단기 토큰 교환
    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID || '',
        client_secret: process.env.INSTAGRAM_APP_SECRET || '',
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/integrations/instagram/callback`,
        code,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/portal/settings?error=instagram_token_failed', request.url));
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;
    const userId = tokenData.user_id;

    // 장기 토큰으로 교환
    const longTokenRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${shortLivedToken}`
    );

    let accessToken = shortLivedToken;
    let expiresIn = 3600;

    if (longTokenRes.ok) {
      const longTokenData = await longTokenRes.json();
      accessToken = longTokenData.access_token;
      expiresIn = longTokenData.expires_in || 5184000; // 60 days
    }

    // 사용자 프로필 가져오기
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`
    );
    const profile = profileRes.ok ? await profileRes.json() : { username: '' };

    // Firestore에 저장
    const db = getAdminFirestore();
    const now = Timestamp.now();

    await db.collection('properties').doc(propertyId)
      .collection('integrations').doc('instagram').set({
        platform: 'instagram',
        accessToken,
        tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + expiresIn * 1000)),
        status: 'active',
        accountId: String(userId),
        accountName: profile.username || '',
        scope: 'user_profile,user_media',
        createdAt: now,
        updatedAt: now,
      });

    return NextResponse.redirect(new URL('/portal/settings?success=instagram', request.url));
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(new URL('/portal/settings?error=instagram_failed', request.url));
  }
}
