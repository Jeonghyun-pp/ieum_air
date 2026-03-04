import { Timestamp } from 'firebase-admin/firestore';

export type IntegrationPlatform = 'instagram' | 'ga4';
export type IntegrationStatus = 'active' | 'expired' | 'revoked';

export interface IntegrationDocument {
  platform: IntegrationPlatform;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Timestamp;
  status: IntegrationStatus;
  accountId?: string;
  accountName?: string;
  scope?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Integration {
  id: string;
  platform: IntegrationPlatform;
  status: IntegrationStatus;
  accountId?: string;
  accountName?: string;
  createdAt: Date;
  updatedAt: Date;
}
