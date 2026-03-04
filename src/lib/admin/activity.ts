import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Log an activity for a property (auto-called by Admin APIs)
 */
export async function logActivity(params: {
  propertyId: string;
  actorId: string;
  actorName?: string;
  action: string;
  target: string;
  detail?: string;
}): Promise<string> {
  const db = getAdminFirestore();
  const ref = await db
    .collection('properties')
    .doc(params.propertyId)
    .collection('activity')
    .add({
      propertyId: params.propertyId,
      actorId: params.actorId,
      actorName: params.actorName || 'Admin',
      action: params.action,
      target: params.target,
      detail: params.detail,
      createdAt: Timestamp.now(),
    });
  return ref.id;
}
