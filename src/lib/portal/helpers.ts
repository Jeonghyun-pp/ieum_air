import { verifyAuth } from '@/lib/auth/middleware';
import { getPropertiesByOwner, getPropertyById } from '@/lib/firebase/firestore';
import { NextRequest } from 'next/server';
import type { Property } from '@/types/property';

/**
 * 현재 요청에서 활성 Property를 찾습니다.
 * 1. ?propertyId=xxx 쿼리가 있으면 해당 property
 * 2. 없으면 사용자의 첫 번째 active property
 * 3. active가 없으면 첫 번째 property
 */
export async function resolveActiveProperty(
  request: NextRequest
): Promise<{ uid: string; property: Property | null }> {
  const user = await verifyAuth(request);
  if (!user) {
    return { uid: '', property: null };
  }

  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (propertyId) {
      const property = await getPropertyById(propertyId);
      if (property && (property.ownerId === user.uid || user.role === 'admin')) {
        return { uid: user.uid, property };
      }
    }

    // 사용자의 properties 조회
    const properties = await getPropertiesByOwner(user.uid);
    if (properties.length === 0) {
      return { uid: user.uid, property: null };
    }

    // active property 우선
    const active = properties.find(p => p.status === 'active');
    return { uid: user.uid, property: active || properties[0] };
  } catch (error) {
    console.error('resolveActiveProperty error:', error);
    return { uid: user.uid, property: null };
  }
}
