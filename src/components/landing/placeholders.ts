// ── 6가지 서비스 ──
export const services = [
  {
    id: "diagnosis",
    icon: "ClipboardCheck",
    title: "경쟁력 진단 리포트",
    description: "경쟁숙소 대비 내 순위, 점수, 약점까지. 데이터로 내 숙소의 현재 위치를 정확히 보여드립니다.",
    color: "purple",
  },
  {
    id: "strategy",
    icon: "Brain",
    title: "AI 맞춤 운영 전략",
    description: "시즌, 이벤트, 시장 데이터를 분석해서 이번 달 뭘 해야 할지 AI가 우선순위까지 정해드립니다.",
    color: "pink",
  },
  {
    id: "pricing",
    icon: "TrendingUp",
    title: "수익 극대화 프라이싱",
    description: "이벤트, 수요, 경쟁가를 반영한 일별 최적 가격 추천. 왜 이 가격인지 이유까지 설명합니다.",
    color: "emerald",
  },
  {
    id: "content",
    icon: "Pencil",
    title: "리스팅 & 콘텐츠 최적화",
    description: "제목, 설명, 사진, 후기 답글까지. 검색 노출과 전환율을 높이는 리스팅으로 바꿔드립니다.",
    color: "blue",
  },
  {
    id: "intelligence",
    icon: "Radar",
    title: "시장 & 경쟁숙소 감시",
    description: "경쟁숙소 가격 변동, 신규 진입, 평점 변화를 24시간 자동 추적해서 알림으로 알려드립니다.",
    color: "orange",
  },
  {
    id: "automation",
    icon: "Zap",
    title: "실시간 성과 대시보드",
    description: "데이터 수집부터 리포트 생성까지 매일 자동. 호스트는 결과만 확인하면 됩니다.",
    color: "green",
  },
] as const;

// ── Hero ──
export const hero = {
  badge: "데이터 기반 숙소 홍보 서비스",
  title: "숙소 매출,\n데이터로 올립니다",
  subtitle:
    "게스트 국적, 지역 이벤트, 시즌 트렌드를 분석해서\n매달 최적의 홍보 전략을 설계하고 실행합니다.",
  cta: "무료 숙소 진단 받기",
  ctaSecondary: "서비스 자세히 보기",
  stats: [
    { value: "79%", label: "평균 점유율 달성" },
    { value: "6가지", label: "통합 서비스 제공" },
    { value: "매달", label: "전략 업데이트" },
  ],
};

// ── How It Works ──
export const howItWorks = {
  title: "진행 방식은 단순합니다",
  steps: [
    {
      number: "01",
      title: "숙소 진단",
      desc: "현재 리스팅, 노출 현황, 게스트 데이터를 분석합니다.",
    },
    {
      number: "02",
      title: "전략 설계",
      desc: "타겟 국가, 채널, 메시지를 한 장으로 정리해 제안합니다.",
    },
    {
      number: "03",
      title: "실행",
      desc: "승인 후 콘텐츠 제작, 리스팅 최적화, 가격 조정을 실행합니다.",
    },
    {
      number: "04",
      title: "리포트",
      desc: "성과 데이터와 다음 달 전략을 포털에서 확인합니다.",
    },
  ],
};

// ── Pricing ──
export const pricing = {
  title: "합리적인 요금제",
  subtitle: "숙소 규모와 필요에 맞게 선택하세요",
  plans: [
    {
      name: "베이직",
      price: "20",
      unit: "만원/월",
      description: "홍보를 시작하는 숙소에 적합",
      features: [
        "리스팅 최적화 (초기 1회)",
        "월 4회 인스타 콘텐츠 제작",
        "촬영 가이드 제공",
        "월간 성과 요약",
      ],
      highlighted: false,
    },
    {
      name: "스탠다드",
      price: "35",
      unit: "만원/월",
      description: "데이터 기반 체계적 홍보",
      features: [
        "베이직 전체 포함",
        "네이버 블로그 월 2회",
        "다국어 번역 (영/일/중)",
        "국적 기반 채널 전략",
        "월간 상세 리포트",
      ],
      highlighted: true,
      badge: "인기",
    },
    {
      name: "프리미엄",
      price: "55",
      unit: "만원/월",
      description: "매출 극대화 풀 서비스",
      features: [
        "스탠다드 전체 포함",
        "이벤트 기반 가격 캘린더",
        "월 8회 인스타 + TikTok",
        "멀티 OTA 등록/관리",
        "가격 전략 월간 컨설팅",
        "전담 매니저 배정",
      ],
      highlighted: false,
    },
  ],
};

// ── Live Demo (가격 캘린더 데모) ──
export const liveDemo = {
  title: "이벤트 기반 가격 추천",
  subtitle: "콘서트, 축제, 연휴를 분석해서 최적의 가격 타이밍을 잡아드립니다",
  events: [
    { date: "3/8", day: "토", event: "벚꽃축제 시작", adjustment: "+20%", type: "festival" as const },
    { date: "3/15", day: "토", event: "BTS 콘서트 (잠실)", adjustment: "+50%", type: "concert" as const },
    { date: "3/22", day: "토", event: "일반 주말", adjustment: "유지", type: "normal" as const },
    { date: "3/29", day: "토", event: "봄 연휴 시작", adjustment: "+30%", type: "holiday" as const },
  ],
};

// ── FAQ ──
export const faq = [
  {
    question: "에어비앤비 이외의 플랫폼도 지원하나요?",
    answer:
      "네, 부킹닷컴, 야놀자, 여기어때 등 주요 OTA 플랫폼을 모두 지원합니다. 프리미엄 플랜에서는 멀티 OTA 등록 및 관리도 대행해 드립니다.",
  },
  {
    question: "최소 계약 기간이 있나요?",
    answer:
      "최소 계약 기간은 3개월입니다. 홍보 효과가 나타나기까지 보통 2~3개월이 소요되기 때문입니다. 이후에는 월 단위로 연장 가능합니다.",
  },
  {
    question: "콘텐츠 촬영도 해주나요?",
    answer:
      "기본적으로 호스트님이 보내주시는 사진을 활용해 콘텐츠를 제작합니다. 촬영 가이드를 제공해 드리며, 필요시 전문 촬영도 별도 의뢰 가능합니다.",
  },
  {
    question: "성과를 어떻게 확인하나요?",
    answer:
      "전용 포털에서 실시간으로 콘텐츠 현황, 채널별 유입 데이터, 가격 캘린더를 확인할 수 있습니다. 매월 말 상세 성과 리포트도 제공됩니다.",
  },
  {
    question: "어떤 데이터를 분석하나요?",
    answer:
      "게스트 국적 비율, 예약 추이, 지역 이벤트, OTA 검색 트렌드 등을 종합 분석합니다. 이를 바탕으로 타겟 국가, 최적 채널, 가격 전략을 매달 새롭게 설계합니다.",
  },
];

// ── Final CTA ──
export const finalCTA = {
  title: "숙소 홍보, 혼자 고민하지 마세요",
  subtitle:
    "무료 숙소 진단으로 현재 리스팅의 개선 포인트를 확인해 보세요.\n데이터 기반 전략이 예약률을 바꿉니다.",
  cta: "무료 진단 시작하기",
};
