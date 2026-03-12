// ============================================
// Diagnosis Types — Phase 2
// ============================================

/** 리뷰 분석 결과 */
export interface ReviewDiagnosis {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number;              // 0-100
  topics: string[];
  topPraises: string[];       // 상위 5개
  topComplaints: string[];    // 상위 5개
  reviewCount: number;
  analyzedAt: string;
}

/** 스크래핑된 리뷰 */
export interface ScrapedReview {
  text: string;
  date?: string;
  rating?: number;
  language?: string;
  reviewerName?: string;
}

/** 사진 진단 결과 */
export interface PhotoDiagnosis {
  photoCount: number;
  compSetMedianPhotos: number;
  resolutionIssues: PhotoIssue[];
  brightnessIssues: PhotoIssue[];
  spacesCovered: string[];
  spacesRecommended: string[];
  missingSpaces: string[];
  overallScore: number;       // 0-100
  analyzedAt: string;
}

export interface PhotoIssue {
  photoUrl: string;
  issue: 'low_resolution' | 'too_dark' | 'too_bright';
  value: number;
  threshold: number;
}

/** 콘텐츠 진단 결과 */
export interface ContentDiagnosis {
  title: TitleAnalysis;
  description: DescriptionAnalysis;
  overallScore: number;       // 0-100
  analyzedAt: string;
}

export interface TitleAnalysis {
  current: string;
  length: number;
  optimalRange: [number, number];
  keywords: string[];
  missingKeywords: string[];
  score: number;              // 0-100
}

export interface DescriptionAnalysis {
  length: number;
  topicsCovered: string[];
  topicsMissing: string[];
  score: number;              // 0-100
}

/** 진단 카테고리 (확장된 스코어카드) */
export interface DiagnosisCategory {
  category: 'price' | 'amenities' | 'photos' | 'reviews' | 'response' | 'content';
  label: string;
  score: number;              // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  weight: number;
  details: string;            // 한 줄 요약
}

/** 확장된 스코어카드 */
export interface EnhancedScorecard {
  overallScore: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  categories: DiagnosisCategory[];
  rank: number;
  totalInCompSet: number;
  analyzedAt: string;
}

/** 종합 진단 결과 */
export interface DiagnosisResult {
  propertyId: string;
  reviewDiagnosis: ReviewDiagnosis;
  photoDiagnosis: PhotoDiagnosis;
  contentDiagnosis: ContentDiagnosis;
  enhancedScorecard: EnhancedScorecard;
  status: 'ready' | 'partial' | 'error';
  createdAt: string;
  updatedAt: string;
}

/** AI 프로바이더 */
export type AIProvider = 'groq' | 'deepseek' | 'openai';
