import { Timestamp } from 'firebase-admin/firestore';

// ============================================
// Property Types
// ============================================

export type PropertyStatus = 'onboarding' | 'active' | 'paused';

export interface AirbnbListingData {
  title?: string;
  photos?: string[];
  pricePerNight?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  scrapedAt?: Date;
}

export interface Property {
  id: string;
  ownerId: string;
  name: string;
  region: string;
  propertyType: string;
  listingUrl?: string;
  monthlyBookings: string;
  guestNationality: string;
  currentActivity: string;
  painPoint: string;
  selectedPlan: string;
  status: PropertyStatus;
  listingData?: AirbnbListingData;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyDocument {
  ownerId: string;
  name: string;
  region: string;
  propertyType: string;
  listingUrl?: string;
  monthlyBookings: string;
  guestNationality: string;
  currentActivity: string;
  painPoint: string;
  selectedPlan: string;
  status: PropertyStatus;
  listingData?: {
    title?: string;
    photos?: string[];
    pricePerNight?: number;
    currency?: string;
    rating?: number;
    reviewCount?: number;
    scrapedAt?: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
