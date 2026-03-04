import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';

// GET /api/integrations/instagram/authorize — Instagram OAuth 시작
export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');

  if (!propertyId) {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'propertyId required' } },
      { status: 400 }
    );
  }

  const clientId = process.env.INSTAGRAM_APP_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/integrations/instagram/callback`;

  // state에 propertyId와 uid를 인코딩
  const state = Buffer.from(JSON.stringify({ propertyId, uid: user.uid })).toString('base64url');

  const authUrl = new URL('https://api.instagram.com/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId || '');
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', 'user_profile,user_media');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);

  return NextResponse.json({ success: true, data: { authUrl: authUrl.toString() } });
}
