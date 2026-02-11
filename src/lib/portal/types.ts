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
