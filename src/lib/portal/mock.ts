// ============================================
// Portal Mock Data
// ============================================

import type {
  PortalData,
  PlanStatus,
  StatusBannerConfig,
} from './types';

// 상태별 StatusBanner 설정
export const statusBannerConfigs: Record<PlanStatus, StatusBannerConfig> = {
  DRAFT: {
    title: '이번 달 플랜을 준비하고 있습니다',
    desc: '관광 수요와 숙소 상황을 반영해 최적의 홍보 전략을 정리 중입니다.',
    primaryCta: {
      label: '플랜 미리보기',
      href: '/portal/plan',
    },
    secondaryCta: {
      label: '문의하기',
      href: '/portal/assets#messages',
    },
  },
  AWAITING_APPROVAL: {
    title: '이번 달 플랜 승인 대기',
    desc: '승인 후 집행을 시작합니다. 수정이 필요하면 요청을 남겨주세요.',
    primaryCta: {
      label: '플랜 승인/수정 요청',
      href: '/portal/plan',
    },
    secondaryCta: {
      label: '필수 자료 업로드',
      href: '/portal/assets',
    },
  },
  APPROVED: {
    title: '플랜 승인이 완료되었습니다',
    desc: '집행 준비 중입니다. 요청된 자료를 업로드하면 더 빠르게 시작할 수 있습니다.',
    primaryCta: {
      label: '자료 업로드',
      href: '/portal/assets',
    },
    secondaryCta: {
      label: '진행 상황 보기',
      href: '/portal/progress',
    },
  },
  RUNNING: {
    title: '이번 달 홍보를 집행 중입니다',
    desc: '성과를 보며 주간 단위로 최적화하고 있습니다.',
    primaryCta: {
      label: '진행 상황 보기',
      href: '/portal/progress',
    },
    secondaryCta: {
      label: '추가 자료 업로드',
      href: '/portal/assets',
    },
  },
  REPORT_READY: {
    title: '이번 달 결과 리포트가 준비되었습니다',
    desc: '핵심 성과와 다음 달 제안을 확인할 수 있습니다.',
    primaryCta: {
      label: '결과 보기',
      href: '/portal/results',
    },
    secondaryCta: {
      label: '리포트 다운로드',
      href: '/portal/results#download',
    },
  },
  ARCHIVED: {
    title: '이번 달 플랜이 보관되었습니다',
    desc: '지난 기록을 확인할 수 있습니다.',
    primaryCta: {
      label: '결과 아카이브 보기',
      href: '/portal/results',
    },
    secondaryCta: {
      label: '다음 달 플랜 보기',
      href: '/portal',
    },
  },
};

// 목업 데이터
export const mockPortalData: PortalData = {
  currentProperty: {
    id: 'prop-001',
    name: '제주 오션뷰 리조트',
    location: '제주시',
  },
  currentMonth: '2026-02',
  status: 'DRAFT',
  strategySummary:
    '이번 달은 일본·대만 단기여행 수요 증가에 맞춰 검색 중심으로 진행합니다.',
  reasons: [
    '2월은 일본·대만 관광객 방문 증가 시기',
    '단기 체류 수요가 높아 검색 노출 최적화 필요',
    '경쟁사 대비 가격 경쟁력 강화 포인트',
  ],
  todos: [
    {
      id: 'todo-001',
      title: '숙소 사진 10장 업로드',
      due: '2026-02-05',
      required: true,
      status: 'pending',
    },
    {
      id: 'todo-002',
      title: '숙소 소개 영문 설명 작성',
      due: '2026-02-07',
      required: true,
      status: 'pending',
    },
    {
      id: 'todo-003',
      title: '특별 프로모션 정보 제공',
      due: '2026-02-10',
      required: false,
      status: 'pending',
    },
    {
      id: 'todo-004',
      title: '체크인/체크아웃 시간 확인',
      due: '2026-02-08',
      required: false,
      status: 'completed',
    },
  ],
  plan: {
    targetCountries: ['일본', '대만', '홍콩'],
    platforms: ['Google 검색', 'Booking.com', 'Agoda'],
    messageFocus: ['오션뷰', '조용한 휴양지', '가족 여행'],
  },
  progress: {
    timelineStep: '2주차 집행 중',
    weeklySummary:
      'Google 검색 노출이 전주 대비 15% 증가했습니다. Booking.com 예약 문의가 활발합니다.',
    channelStatus: [
      {
        channel: 'Google 검색',
        status: 'active',
        performance: '노출 15% 증가',
      },
      {
        channel: 'Booking.com',
        status: 'active',
        performance: '문의 8건',
      },
      {
        channel: 'Agoda',
        status: 'paused',
        performance: '대기 중',
      },
    ],
  },
  results: {
    highlights: [
      '전체 예약률 23% 증가',
      '일본 시장 신규 고객 45%',
      '평균 체류 기간 2.3일',
    ],
    metrics: [
      {
        label: '총 노출 수',
        value: '12,450',
        delta: '+18%',
      },
      {
        label: '예약 전환율',
        value: '4.2%',
        delta: '+0.8%p',
      },
      {
        label: '평균 객실 요금',
        value: '₩85,000',
        delta: '+5%',
      },
    ],
  },
};
