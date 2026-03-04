import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Instagram 장기 토큰 갱신
 * Instagram Basic Display API 장기 토큰은 60일마다 갱신 필요
 */
export async function refreshInstagramToken(currentToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
} | null> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Instagram token refresh failed:', error);
    return null;
  }
}

/**
 * Google OAuth 토큰 갱신 (GA4용)
 */
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
} | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Google token refresh failed:', error);
    return null;
  }
}

/**
 * 만료 임박 토큰 일괄 갱신
 */
export async function refreshAllExpiringTokens(): Promise<{ refreshed: number; failed: number }> {
  const db = getAdminFirestore();
  const now = Timestamp.now();
  // 3일 이내 만료 토큰 갱신
  const threshold = Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

  let refreshed = 0;
  let failed = 0;

  // 모든 properties 순회
  const propertiesSnap = await db.collection('properties').get();

  for (const propDoc of propertiesSnap.docs) {
    const integrationsSnap = await propDoc.ref.collection('integrations')
      .where('status', '==', 'active')
      .get();

    for (const intDoc of integrationsSnap.docs) {
      const data = intDoc.data();

      // 만료 임박 확인
      if (data.tokenExpiresAt && data.tokenExpiresAt.toMillis() > threshold.toMillis()) {
        continue; // 아직 여유 있음
      }

      let result = null;

      if (data.platform === 'instagram' && data.accessToken) {
        result = await refreshInstagramToken(data.accessToken);
      } else if (data.platform === 'ga4' && data.refreshToken) {
        result = await refreshGoogleToken(data.refreshToken);
      }

      if (result) {
        await intDoc.ref.update({
          accessToken: result.accessToken,
          tokenExpiresAt: Timestamp.fromDate(new Date(Date.now() + result.expiresIn * 1000)),
          updatedAt: now,
        });
        refreshed++;
      } else {
        await intDoc.ref.update({
          status: 'expired',
          updatedAt: now,
        });
        failed++;
      }
    }
  }

  return { refreshed, failed };
}
