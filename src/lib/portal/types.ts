// ============================================
// Portal Types
// ============================================

export type PlanStatus =
  | 'DRAFT'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'RUNNING'
  | 'REPORT_READY'
  | 'ARCHIVED';

export interface StatusBannerConfig {
  title: string;
  desc: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
}

export interface Property {
  id: string;
  name: string;
  location: string;
}

export interface Todo {
  id: string;
  title: string;
  due: string;
  required: boolean;
  status: 'pending' | 'completed';
}

export interface Plan {
  targetCountries: string[];
  platforms: string[];
  messageFocus: string[];
}

export interface ChannelStatus {
  channel: string;
  status: 'active' | 'paused' | 'completed';
  performance: string;
}

export interface Progress {
  timelineStep: string;
  weeklySummary: string;
  channelStatus: ChannelStatus[];
}

export interface Metric {
  label: string;
  value: string;
  delta: string;
}

export interface Results {
  highlights: string[];
  metrics: Metric[];
}

export interface PortalData {
  currentProperty: Property;
  currentMonth: string;
  status: PlanStatus;
  strategySummary: string;
  reasons: string[];
  todos: Todo[];
  plan: Plan;
  progress: Progress;
  results: Results;
}

// ============================================
// Subcollection Types (Firestore)
// ============================================

export interface PlanDocument {
  id?: string;
  month: string; // "2026-03"
  status: PlanStatus;
  strategySummary: string;
  reasons: string[];
  targetCountries: string[];
  platforms: string[];
  messageFocus: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface PricingEventDocument {
  id?: string;
  month: string;
  date: number;
  event?: string;
  adjustment: string;
  type: 'concert' | 'festival' | 'holiday' | 'sport' | 'local' | 'normal';
  applied?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface ContentDocument {
  id?: string;
  title: string;
  type: 'instagram' | 'tiktok' | 'blog';
  status: 'backlog' | 'completed' | 'in_progress' | 'review';
  date: string;
  thumbnail?: string;
  fileUrl?: string;
  month: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AnalyticsDocument {
  id?: string;
  month: string;
  nationalityBreakdown: { name: string; value: number; color: string }[];
  bookingTrend: { month: string; bookings: number; views: number }[];
  channelData: { channel: string; visitors: number }[];
  channelRecommendations: {
    country: string;
    flag: string;
    channels: string[];
    primary: string;
  }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface AssetDocument {
  id?: string;
  type: 'todo' | 'file' | 'message';
  // Todo fields
  title?: string;
  due?: string;
  required?: boolean;
  todoStatus?: 'pending' | 'completed';
  // File fields
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  // Message fields
  subject?: string;
  body?: string;
  month?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ResultDocument {
  id?: string;
  month: string;
  highlights: string[];
  metrics: Metric[];
  reportUrl?: string;
  publishedToPortal?: boolean;
  nationalityComparison?: { name: string; current: number; previous: number }[];
  channelComparison?: { channel: string; current: number; previous: number }[];
  pricingEventEffects?: { event: string; adjustment: string; result: string }[];
  createdAt?: any;
  updatedAt?: any;
}

export interface MemoDocument {
  id?: string;
  propertyId: string;
  authorId: string;
  authorName?: string;
  content: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ActivityDocument {
  id?: string;
  propertyId: string;
  actorId: string;
  actorName?: string;
  action: string;
  target: string;
  detail?: string;
  createdAt?: any;
}

export interface CalendarEventDocument {
  id?: string;
  name: string;
  date: string; // "2026-03-15"
  endDate?: string;
  type: 'concert' | 'festival' | 'holiday' | 'sport' | 'local';
  region: string;
  impact: string; // "+20%", "+50%"
  description?: string;
  createdAt?: any;
  updatedAt?: any;
}
