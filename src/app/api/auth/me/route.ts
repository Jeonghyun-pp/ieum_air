import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { getUserById, createUser } from '@/lib/firebase/firestore';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  // 먼저 requireUserDocument: false로 토큰만 검증
  const tokenUser = await verifyAuth(request, { requireUserDocument: false });

  if (!tokenUser) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    let userData = await getUserById(tokenUser.uid);

    // 유저 문서가 없으면 자동 생성 (회원가입 시 서버 에러로 생성 실패한 경우)
    if (!userData) {
      try {
        const auth = getAdminAuth();
        const firebaseUser = await auth.getUser(tokenUser.uid);

        await createUser(tokenUser.uid, {
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          role: 'advertiser',
          authProviders: firebaseUser.providerData.map(p => p.providerId) as any[],
        });

        userData = await getUserById(tokenUser.uid);
      } catch (createError) {
        console.error('Auto-create user error:', createError);
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'User not found and auto-creation failed' } },
          { status: 404 }
        );
      }
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
      { status: 500 }
    );
  }
}
