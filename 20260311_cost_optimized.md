# StayTrend 최적화 파이프라인 — 비용 절감 버전

> 작성일: 2026-03-11
> 기반 문서: `20260311.md` (원본 계획), 비용 절감 리서치 결과
> 목표: 월 $200 → $10~20 수준으로 절감 (90%↓)

---

## 목차

1. [비용 절감 요약](#1-비용-절감-요약)
2. [변경된 기술 스택](#2-변경된-기술-스택)
3. [Phase별 비용 비교](#3-phase별-비용-비교)
4. [Phase 1 상세 구현 계획 (수정)](#4-phase-1-상세-구현-계획-수정)
5. [Phase 2~4 변경 요약](#5-phase-24-변경-요약)
6. [리스크 & 대응 전략](#6-리스크--대응-전략)

---

## 1. 비용 절감 요약

### 1.1 핵심 변경 3가지

```
① 스크래핑: Playwright + ScraperAPI ($49) → HTTP + Cheerio ($0)
   Airbnb의 data-deferred-state JSON을 직접 파싱
   프록시 없이 딜레이 + UA 로테이션으로 시작

② AI 모델: Claude Sonnet + GPT-4o ($50~75) → Gemini Flash 무료 + Groq 무료 ($0~5)
   무료 티어 조합으로 월 100 숙소 충분히 커버
   Fallback 체인으로 안정성 확보

③ 인프라: Vercel Pro + BigQuery ($25~40) → Vercel Hobby + Firestore 집계 ($0~5)
   크론 통합 + QStash로 Hobby 제한 우회
   BigQuery 대신 Firestore 월간 집계 문서
```

### 1.2 비용 비교표

| Phase | 원본 계획 | 절감 버전 | 절감율 |
|-------|----------|----------|-------|
| Phase 1 (기반) | ~$80/mo | **~$5** | 94% |
| Phase 2 (진단) | ~$120/mo | **~$5~10** | 92% |
| Phase 3 (AI 제안) | ~$180/mo | **~$10~15** | 92% |
| Phase 4 (추적) | ~$200/mo | **~$10~20** | 90% |

---

## 2. 변경된 기술 스택

### 2.1 원본 vs 절감 비교

| 영역 | 원본 계획 | 절감 버전 | 월 절감 |
|------|----------|----------|--------|
| **스크래핑** | Crawlee + Playwright | **HTTP fetch + Cheerio** (기존 스택 활용) | -$0 (패키지 추가 불필요) |
| **프록시** | ScraperAPI $49/mo | **프록시 없이 시작** → 차단 시 Bright Data 종량제 | -$49 → -$41 |
| **비동기 작업** | Inngest 유료 | **Inngest 무료** (25K 스텝/mo) 또는 **QStash 무료** | -$25 |
| **크론 스케줄링** | Vercel Pro 크론 | **Upstash QStash 무료** (500 msg/day) | -$0 (Pro 불필요) |
| **호스팅** | Vercel Pro $20/mo | **Vercel Hobby 무료** + Fluid Compute 60초 | -$20 |
| **리뷰 분석** | GPT-4o-mini $5~15 | **Groq 무료** (Llama 3.3 70B, 15M 토큰/mo) | -$10 |
| **사진 분석** | GPT-4o Vision $10~30 | **Sharp + 수량 비교** (AI 불필요) | -$20 |
| **제목/설명 생성** | Claude Sonnet $15~30 | **Gemini 2.5 Flash 무료** (250 req/day) | -$22 |
| **시계열 DB** | BigQuery $5~20 | **Firestore 집계 문서** | -$12 |
| **캐싱** | Vercel KV | **Next.js `use cache` + ISR** | -$0 |
| **AI 결과 캐싱** | Vercel KV | **Firestore 직접 저장** | -$0 |

### 2.2 절감 버전 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                StayTrend Tech Stack (Cost-Optimized)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Frontend ─────────────────────────────────────────────────┐ │
│  │  Next.js 16 + React 18 + TypeScript          (변경 없음)  │ │
│  │  TailwindCSS + Radix UI + Recharts            (변경 없음)  │ │
│  │  Next.js `use cache` + ISR                    (캐싱 전략)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ API Layer ────────────────────────────────────────────────┐ │
│  │  Next.js API Routes                           (변경 없음)  │ │
│  │  Auth: Firebase Auth     Validation: Zod      (변경 없음)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ AI Layer (무료 티어 조합) ───────────────────────────────┐ │
│  │  Groq 무료 (Llama 3.3 70B) : 리뷰 분석, 토픽 추출       │ │
│  │  Gemini 2.5 Flash 무료     : 제목/설명 생성, 리포트       │ │
│  │  Google Cloud Vision 무료  : 사진 분류 (1,000장/mo)       │ │
│  │  ─── Fallback ───                                         │ │
│  │  DeepSeek V3    : $0.28/1M (Groq 장애 시)                │ │
│  │  GPT-4o-mini    : $0.15/1M (최후 수단)                   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Data Collection ──────────────────────────────────────────┐ │
│  │  HTTP fetch + Cheerio   : Airbnb 스크래핑     (기존 활용)  │ │
│  │  InsideAirbnb CSV       : 비교군 기초 데이터   (무료)      │ │
│  │  Instagram API + GA4    : 성과 데이터          (기존)      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Data Storage ─────────────────────────────────────────────┐ │
│  │  Firestore        : 현재 상태 + 집계 문서      (기존)      │ │
│  │  Firebase Storage : 사진/파일                  (기존)      │ │
│  │  ※ BigQuery 제거, Vercel KV 제거                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Orchestration ────────────────────────────────────────────┐ │
│  │  Upstash QStash 무료 : 크론 스케줄링 (500 msg/day)        │ │
│  │  Inngest 무료        : 장시간 작업 체인 (25K 스텝/mo)     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ Deployment ───────────────────────────────────────────────┐ │
│  │  Vercel Hobby 무료 : 호스팅 + Edge + Fluid Compute 60초   │ │
│  │  Google Cloud      : Firebase (기존)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 패키지 변경

```
원본 계획에서 추가 예정이었던 패키지:
  ✗ crawlee              → 불필요 (HTTP + Cheerio로 충분)
  ✗ playwright           → 불필요 (브라우저 자동화 불필요)
  ✗ @anthropic-ai/sdk    → Phase 3에서도 불필요 (Gemini Flash 사용)
  ✗ @vercel/kv           → 불필요 (Next.js use cache + Firestore)
  ✗ @google-cloud/bigquery → 불필요 (Firestore 집계)
  ✗ @react-pdf/renderer  → Phase 4에서 필요 시 추가
  ✗ @tremor/react        → Phase 4에서 필요 시 추가

실제 필요한 패키지:
  ○ inngest              → 무료 티어 (장시간 작업 체인)
  ○ sharp                → 이미지 해상도/밝기 체크 (Phase 2)
  ○ @upstash/qstash      → 무료 티어 (크론 스케줄링)
  ○ @google/generative-ai → Gemini API (무료 티어)
  ○ groq-sdk             → Groq API (무료 티어)

npm install inngest @upstash/qstash @google/generative-ai groq-sdk
# sharp는 Phase 2에서 추가
```

---

## 3. Phase별 비용 비교

### 3.1 Phase 1 — 비교군 엔진 + 시장 벤치마킹

| 항목 | 원본 | 절감 | 방법 |
|------|------|------|------|
| 스크래핑 런타임 | Crawlee+Playwright | **$0** | HTTP+Cheerio (기존 cheerio 활용) |
| 프록시 | ScraperAPI $49 | **$0** | 프록시 없이 시작 (8K req/mo, 딜레이+UA) |
| 비동기 작업 | Inngest ~$25 | **$0** | Inngest 무료 (25K 스텝, 8K 사용) |
| 호스팅 | Vercel Pro $20 | **$0** | Vercel Hobby + QStash |
| DB | Firestore $5~10 | **$3~5** | 읽기 최적화 + 캐싱 |
| **합계** | **~$80** | **~$3~5** | |

### 3.2 Phase 2 — 리스팅 진단 + 건강 점수

| 항목 | 원본 | 절감 | 방법 |
|------|------|------|------|
| 리뷰 분석 | GPT-4o-mini $5~15 | **$0** | Groq 무료 (Llama 3.3 70B) |
| 사진 분석 | GPT-4o Vision $10~30 | **$0** | Sharp (해상도/밝기) + 수량 비교 |
| 사진 분류 | (위에 포함) | **$0** | Cloud Vision 무료 (1,000장/mo) |
| Phase 1 유지 | ~$75 | ~$5 | |
| **누적 합계** | **~$120** | **~$5~10** | |

### 3.3 Phase 3 — AI 최적화 제안

| 항목 | 원본 | 절감 | 방법 |
|------|------|------|------|
| 제목/설명 생성 | Claude Sonnet $15~30 | **$0~2** | Gemini 2.5 Flash 무료 (250 req/day) |
| 이벤트 데이터 | PredictHQ $0~50 | **$0** | 공휴일 DB + 수동 이벤트 등록 |
| 캐싱 | Vercel KV $0 | **$0** | Firestore 직접 저장 |
| Phase 1+2 유지 | ~$100 | ~$8 | |
| **누적 합계** | **~$180** | **~$10~15** | |

### 3.4 Phase 4 — 성과 추적 + 효과 증명

| 항목 | 원본 | 절감 | 방법 |
|------|------|------|------|
| 시계열 DB | BigQuery $5~20 | **$0** | Firestore 월간/일간 집계 문서 |
| 대시보드 | Tremor | **$0** | Recharts (기존) 유지 |
| Phase 1~3 유지 | ~$150 | ~$12 | |
| **누적 합계** | **~$200** | **~$12~20** | |

### 3.5 비용 요약 그래프

```
월 비용 (USD)
  $200 ┤                                          ████ $200
       │                              ████ $180   ████
       │                 ████ $120    ████        ████
  $100 ┤                 ████         ████        ████
       │    ████ $80     ████         ████        ████
       │    ████         ████         ████        ████
       │    ████         ████         ████        ████
       │    ████         ████         ████        ████
   $20 ┤    ████         ████         ████        ████
       │    ▓▓▓▓ $5      ▓▓▓▓ $8     ▓▓▓▓ $13   ▓▓▓▓ $16
    $0 ┤────────────────────────────────────────────────────
         Phase 1       Phase 2      Phase 3      Phase 4

    ████ 원본 계획    ▓▓▓▓ 절감 버전
```

---

## 4. Phase 1 상세 구현 계획 (수정)

> 원본 계획(20260311.md §4)의 구조를 유지하되, 비용 절감 변경 사항만 반영

### 4.1 전체 데이터 흐름 (변경 없음)

```
[호스트 온보딩]
  │  Airbnb URL 입력
  ▼
[Step A] 자사 리스팅 스크래핑 (강화 — Cheerio 유지)     ← 변경
  ▼
[Step B] 비교군 탐색 (신규)                              ← 동일
  ▼
[Step C] 비교군 상세 스크래핑 (Inngest 무료 티어)        ← 변경
  ▼
[Step D] 분석 파이프라인 (동일)
  ▼
[포털 표시]
```

### 4.2 Step A — 스크래핑 방식 변경 (핵심 변경)

#### 원본: Crawlee + Playwright → 절감: HTTP + Cheerio

```
원본 계획:
  Crawlee + Playwright (헤드리스 브라우저)
  → 실제 브라우저 실행, JS 렌더링 후 데이터 추출
  → 메모리 200~500MB/인스턴스, 3~10초/페이지
  → Vercel Pro 필요 (300초 제한)

절감 버전:
  HTTP fetch + Cheerio (기존 스택)
  → Airbnb HTML의 <script id="data-deferred-state-0"> 파싱
  → 메모리 10~30MB/인스턴스, 0.5~2초/페이지
  → Vercel Hobby로 충분 (60초 제한 내)
```

#### Airbnb data-deferred-state 활용

```
Airbnb 리스팅 페이지 HTML에 포함된 데이터 소스:

  <script id="data-deferred-state-0">
    { ... 전체 리스팅 데이터 JSON ... }
  </script>

  이 JSON에 포함된 데이터:
  ✓ title, description         (제목, 설명)
  ✓ amenities[]                (편의시설 전체 목록)
  ✓ photos[]                   (사진 URL + 캡션)
  ✓ pricing                    (1박 가격, 청소비 등)
  ✓ reviewScores               (카테고리별 평점)
  ✓ location { lat, lng }      (좌표)
  ✓ propertyType, roomType     (숙소 유형)
  ✓ host info                  (응답률, 슈퍼호스트 등)

  → 브라우저 렌더링 없이 모든 필요 데이터 추출 가능
```

#### 스크래퍼 코드 구조 (변경)

```typescript
// src/lib/scraping/airbnb-detail-scraper.ts

import * as cheerio from "cheerio"

// UA 로테이션 풀
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36...",
  // ... 10~20개
]

export async function scrapeListingDetail(
  listingId: string
): Promise<ScrapedListing> {
  const url = `https://www.airbnb.com/rooms/${listingId}`

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
    },
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const html = await response.text()
  const $ = cheerio.load(html)

  // 1순위: data-deferred-state JSON
  const deferredState = $("#data-deferred-state-0").text()
  if (deferredState) {
    const data = JSON.parse(deferredState)
    return parseDeferredState(data, listingId)
  }

  // 2순위: JSON-LD (fallback)
  const jsonLd = $('script[type="application/ld+json"]').text()
  if (jsonLd) {
    return parseJsonLd(JSON.parse(jsonLd), listingId)
  }

  throw new Error("No data found")
}

function parseDeferredState(data: any, listingId: string): ScrapedListing {
  // niobeMinimalClientData[0][1].data.presentation.stayProductDetailPage.sections
  const clientData = data.niobeMinimalClientData?.[0]?.[1]
  const sections = clientData?.data?.presentation?.stayProductDetailPage?.sections

  // 각 섹션에서 필요한 데이터 추출
  const overview = findSection(sections, "OVERVIEW_DEFAULT")
  const amenities = findSection(sections, "AMENITIES_DEFAULT")
  const location = findSection(sections, "LOCATION_DEFAULT")
  const reviews = findSection(sections, "REVIEWS_DEFAULT")
  const pricing = findSection(sections, "BOOK_IT_SIDEBAR")
  const photos = findSection(sections, "PHOTO_TOUR_SCROLLABLE")
  const host = findSection(sections, "HOST_PROFILE_DEFAULT")
  const description = findSection(sections, "DESCRIPTION_DEFAULT")

  return {
    listingId,
    title: overview?.title ?? "",
    description: description?.htmlDescription?.htmlText ?? "",
    propertyType: overview?.propertyType ?? "",
    roomType: overview?.roomType ?? "",
    accommodates: overview?.personCapacity ?? 0,
    bedrooms: overview?.bedroomLabel ? parseInt(overview.bedroomLabel) : 0,
    beds: overview?.bedLabel ? parseInt(overview.bedLabel) : 0,
    bathrooms: overview?.bathLabel ? parseInt(overview.bathLabel) : 0,
    location: {
      lat: location?.lat ?? 0,
      lng: location?.lng ?? 0,
      neighborhood: location?.subtitle ?? "",
    },
    pricePerNight: pricing?.price?.amount ?? 0,
    currency: pricing?.price?.currency ?? "KRW",
    amenities: amenities?.amenities?.map((a: any) => a.title) ?? [],
    photos: photos?.photos?.map((p: any) => ({
      url: p.baseUrl,
      caption: p.caption ?? undefined,
    })) ?? [],
    rating: reviews?.overallRating ?? 0,
    reviewCount: reviews?.reviewCount ?? 0,
    reviewScores: reviews?.categoryRatings ?? {},
    isSuperhost: host?.isSuperhost ?? false,
    hostResponseRate: host?.responseRate,
    instantBookable: pricing?.instantBookable ?? false,
    minimumNights: pricing?.minNights ?? 1,
    calendar: [], // 별도 API 호출로 수집
    scrapedAt: new Date().toISOString(),
    listingUrl: `https://www.airbnb.com/rooms/${listingId}`,
  }
}
```

#### 캘린더 데이터: Airbnb 내부 API 직접 호출

```typescript
// 캘린더는 data-deferred-state에 없을 수 있음
// → Airbnb 내부 API 직접 호출

export async function scrapeCalendar(
  listingId: string,
  months: number = 3
): Promise<CalendarDay[]> {
  const url = `https://www.airbnb.com/api/v3/PdpAvailabilityCalendar`
    + `?operationName=PdpAvailabilityCalendar`
    + `&variables={"request":{"listingId":"${listingId}","month":${new Date().getMonth() + 1},"year":${new Date().getFullYear()},"count":${months}}}`

  const response = await fetch(url, {
    headers: {
      "X-Airbnb-API-Key": AIRBNB_PUBLIC_API_KEY, // 페이지 소스에서 추출 가능
      "User-Agent": getRandomUA(),
    },
  })

  const data = await response.json()
  return data.data.merlin.pdpAvailabilityCalendar.calendarMonths
    .flatMap((month: any) => month.days)
    .map((day: any) => ({
      date: day.calendarDate,
      available: day.available,
      price: day.price?.amount,
    }))
}
```

#### 차단 방지 전략 (프록시 없는 버전)

```
프록시 없이 8,000 req/mo 운영 전략:

  1. 요청 분산
     - 월 8,000건 ÷ 30일 = ~267건/일
     - 하루 중 8시간에 분산 = ~33건/시간
     - 요청 간 3~5초 랜덤 딜레이

  2. UA 로테이션
     - 실제 브라우저 UA 20개 풀에서 랜덤 선택
     - 매 요청마다 변경

  3. 헤더 현실화
     - Accept, Accept-Language, Accept-Encoding
     - Referer: https://www.airbnb.com/
     - sec-ch-ua, sec-fetch-* 헤더 포함

  4. Vercel 자연 IP 분산
     - Vercel Serverless는 여러 리전/IP에서 실행
     - 단일 IP에서 대량 요청하는 패턴이 아님
     - 자연스러운 분산 효과

  5. 차단 감지 & 백오프
     - 403/429 응답 시 자동 백오프 (1분 → 5분 → 30분)
     - 연속 3회 차단 시 해당 날 중단, 다음 날 재시도

  6. 차단 시 업그레이드 경로
     - Bright Data 종량제: $0.001/요청 = $8/mo
     - 또는 Scrape.do: $29/mo (100K 요청)
```

### 4.3 Step B — 비교군 탐색 (변경 사항)

#### InsideAirbnb 활용 (신규 — 비용 $0)

```
InsideAirbnb.com에서 주요 한국 도시 CSV 무료 제공:
  - 서울, 부산, 제주 등 데이터 있음
  - listings.csv: 제목, 설명, 편의시설, 평점, 가격, 좌표 등
  - calendar.csv: 날짜별 가용성/가격

활용 전략:
  1. 온보딩 시 해당 도시 CSV 다운로드 (월 1회 갱신)
  2. CSV에서 좌표 기반 비교군 후보 추출 (Haversine 거리 계산)
  3. 기초 데이터(편의시설, 평점, 가격)는 CSV에서 바로 사용
  4. 실시간 데이터(캘린더, 현재 가격)만 직접 스크래핑

  스크래핑 절감 효과:
    원본: 75개 비교군 × 상세 스크래핑 = 75 요청
    절감: CSV 기초 + 75개 캘린더만 스크래핑 = 75 요청
    → 상세 스크래핑 자체는 비슷하지만,
      CSV로 필터링 후 정확한 비교군만 스크래핑 (불필요한 요청 제거)
```

#### 하이브리드 비교군 전략

```
┌─────────────────────────────────────────────────────┐
│  비교군 데이터 소스 (하이브리드)                       │
│                                                     │
│  InsideAirbnb CSV (무료, 월 1회 업데이트)            │
│  ├── 기본 정보: 제목, 설명, 숙소 유형                │
│  ├── 편의시설 목록 (편의시설 격차 분석용)             │
│  ├── 평점, 리뷰 수 (스코어카드용)                    │
│  ├── 가격 스냅샷 (대략적 포지셔닝)                   │
│  └── 좌표 (거리 계산)                               │
│                                                     │
│  직접 스크래핑 (실시간 데이터만)                      │
│  ├── 현재 1박 가격 (날짜별)                         │
│  ├── 캘린더 가용성 (향후 90일)                      │
│  ├── 최신 리뷰 점수                                │
│  └── 사진 수량 (최신)                               │
│                                                     │
│  → CSV로 비교군 후보 100개 필터링                    │
│  → 상위 75개만 실시간 스크래핑                       │
│  → 불필요한 스크래핑 최소화                          │
└─────────────────────────────────────────────────────┘
```

#### InsideAirbnb CSV 파서

```typescript
// src/lib/data/insideairbnb-parser.ts

import { parse } from "csv-parse/sync"

interface InsideAirbnbListing {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  property_type: string
  room_type: string
  accommodates: number
  bedrooms: number
  beds: number
  bathrooms: number
  amenities: string[]     // JSON 배열 문자열 파싱
  price: number           // "$85.00" → 85
  review_scores_rating: number
  number_of_reviews: number
  host_is_superhost: boolean
  instant_bookable: boolean
  // ... 기타 필드
}

export async function loadCompSetFromCSV(
  csvPath: string,      // Firebase Storage에 저장된 CSV URL
  criteria: CompSetCriteria
): Promise<InsideAirbnbListing[]> {
  const response = await fetch(csvPath)
  const csvText = await response.text()
  const records = parse(csvText, { columns: true, skip_empty_lines: true })

  return records
    .map(parseRecord)
    .filter(listing =>
      // 유형 필터
      listing.room_type === criteria.roomType &&
      // 규모 필터
      Math.abs(listing.accommodates - criteria.accommodates) <= 2 &&
      Math.abs(listing.bedrooms - criteria.bedrooms) <= 1 &&
      // 활성 필터
      listing.number_of_reviews > 0
    )
    .map(listing => ({
      ...listing,
      distance: haversineKm(
        criteria.centerLat, criteria.centerLng,
        listing.latitude, listing.longitude
      ),
    }))
    .filter(listing => listing.distance <= 6) // 최대 6km
    .sort((a, b) => a.distance - b.distance)
    .slice(0, criteria.targetSize)            // 상위 75개
}
```

### 4.4 Step C — 비교군 스크래핑 (Inngest 무료 티어)

#### Inngest 무료 티어 확인

```
Inngest 무료 티어 (2026 기준):
  - 25,000 스텝/월
  - 무제한 함수 수
  - 최대 7일 실행 이력

StayTrend 사용량 (100 숙소 기준):
  - 온보딩: 1(자사 스크래핑) + 1(비교군 탐색) + 75(상세 스크래핑) + 3(분석) = 80 스텝
  - 월간 갱신: 동일 80 스텝
  - 100 숙소 × 80 = 8,000 스텝/월
  → 25,000 한도 내 (32% 사용)
```

#### 작업 체인 (변경 없음, 런타임만 다름)

```
원본과 동일한 4단계 체인:
  함수 1: scrape-own-listing     (HTTP+Cheerio, ~2초)
  함수 2: build-comp-set         (CSV 필터링 + 검색, ~10초)
  함수 3: scrape-comp-details    (75개 × HTTP+Cheerio, 각 2초)
  함수 4: analyze-market-intel   (Node.js 집계, ~5초)

변경된 점:
  - Playwright → HTTP+Cheerio로 각 스텝이 더 빠름
  - 메모리 사용량 1/10 (500MB → 30MB)
  - Vercel Hobby 60초 제한 내에서 실행 가능

전체 소요 시간:
  함수 1: ~2초
  함수 2: ~10초 (CSV 필터링)
  함수 3: ~3~5분 (75개, 동시 5개, 각 2초 + 3초 딜레이)
  함수 4: ~5초
  전체: ~4~6분 (원본 7~15분 대비 단축)
```

### 4.5 Step D — 분석 파이프라인 (변경 없음)

```
분석 로직 자체는 원본 계획과 동일:
  - D-1: 편의시설 격차 분석 (Node.js 빈도 카운트)
  - D-2: 가격 벤치마킹 (통계 기반 백분위 계산)
  - D-3: 경쟁력 스코어카드 (가중 평균 점수)

변경 없는 이유:
  → 이 분석들은 순수 Node.js 로직 (외부 API 불필요)
  → AI 사용 없음
  → Firestore 읽기/쓰기만 발생
```

### 4.6 Firestore 데이터 모델 (추가)

```
원본 계획의 데이터 모델 유지 + 아래 추가:

properties/{id}/csv-cache
  ├── source: "insideairbnb"
  ├── city: "busan"
  ├── downloadedAt: "2026-03-01"
  ├── recordCount: 3542
  └── storageUrl: "gs://staytrend/.../busan_listings.csv"

properties/{id}/analytics-monthly/{YYYY-MM}    ← Phase 4용 (BigQuery 대체)
  ├── views, bookings, revenue, occupancy
  ├── searchRank (평균/최고/최저)
  ├── compSetMedianPrice
  └── healthScore

properties/{id}/analytics-daily/{YYYY-MM-DD}   ← 최근 90일만 유지 (TTL)
  ├── views, bookings, revenue
  └── searchRank
```

### 4.7 API 엔드포인트 (변경 없음)

```
원본 계획과 동일한 6개 엔드포인트:
  POST  /api/properties/[id]/comp-set/build
  GET   /api/properties/[id]/comp-set
  GET   /api/properties/[id]/comp-set/status
  GET   /api/portal/market-intel
  GET   /api/portal/price-benchmark
  GET   /api/portal/amenity-analysis

추가:
  POST  /api/inngest                            ← Inngest webhook
  POST  /api/cron/daily                         ← 통합 크론 엔드포인트
```

### 4.8 크론 통합 (신규)

```
기존 7개 크론 → 1~2개로 통합 (Vercel Hobby 호환):

// src/app/api/cron/daily/route.ts
export async function GET(request: Request) {
  // QStash 또는 Vercel Cron에서 호출
  const today = new Date()
  const dayOfWeek = today.getDay()
  const dayOfMonth = today.getDate()

  // 매일 실행
  await collectInstagramData()
  await collectGA4Data()
  await refreshExpiredTokens()

  // 주 1회 (일요일)
  if (dayOfWeek === 0) {
    await triggerAirbnbScrapeRefresh()
  }

  // 월 1회 (1일)
  if (dayOfMonth === 1) {
    await aggregateMonthlyAnalytics()
    await generateMonthlyReport()
    await refreshCompSets()
  }

  return Response.json({ success: true })
}
```

### 4.9 포털 UI 변경 (변경 없음)

```
원본 계획과 동일:
  /portal          → 경쟁력 요약 카드 추가
  /portal/pricing  → 비교군 가격 오버레이
  /portal/content  → 편의시설 분석 탭 추가
```

### 4.10 파일 구조 (수정)

```
src/
├── inngest/
│   ├── client.ts                        # Inngest 클라이언트 (무료 티어)
│   └── functions/
│       ├── scrape-own-listing.ts         # 자사 리스팅 스크래핑
│       ├── build-comp-set.ts            # CSV 필터링 + 비교군 구성
│       ├── scrape-comp-details.ts       # 비교군 실시간 데이터 스크래핑
│       └── analyze-market-intel.ts      # 분석 파이프라인
│
├── lib/
│   ├── scraping/
│   │   ├── airbnb.ts                    # 기존 (유지/참조)
│   │   ├── airbnb-detail-scraper.ts     # HTTP+Cheerio 상세 스크래퍼
│   │   ├── airbnb-search-scraper.ts     # 검색 결과 스크래퍼
│   │   ├── airbnb-calendar.ts           # 캘린더 API 호출        ← 신규
│   │   └── ua-rotator.ts               # UA 로테이션             ← 신규 (proxy-config 대체)
│   │
│   ├── data/
│   │   └── insideairbnb-parser.ts       # CSV 파서               ← 신규
│   │
│   ├── analysis/
│   │   ├── comp-set-builder.ts          # 비교군 필터링 로직
│   │   ├── amenity-analyzer.ts          # 편의시설 격차 분석
│   │   ├── price-benchmarker.ts         # 가격 벤치마킹
│   │   └── scorecard-generator.ts       # 경쟁력 스코어카드
│   │
│   └── ai/
│       ├── provider.ts                  # AI Fallback 체인 관리   ← 신규
│       ├── groq-client.ts              # Groq 무료 (리뷰 분석)   ← 신규
│       └── gemini-client.ts            # Gemini 무료 (생성)      ← 신규
│
├── app/
│   └── api/
│       ├── inngest/route.ts             # Inngest webhook
│       ├── cron/daily/route.ts          # 통합 크론              ← 신규
│       ├── properties/[id]/comp-set/
│       │   ├── build/route.ts
│       │   ├── route.ts
│       │   └── status/route.ts
│       └── portal/
│           ├── market-intel/route.ts
│           ├── price-benchmark/route.ts
│           └── amenity-analysis/route.ts
│
└── types/
    ├── scraping.ts
    ├── comp-set.ts
    └── market-intel.ts
```

### 4.11 Phase 1 요약 (수정)

```
호스트가 보게 되는 것:  (원본과 동일)
┌─────────────────────────────────────────┐
│ "당신의 숙소는 주변 75개 경쟁 숙소 중    │
│  상위 45%에 위치합니다.                  │
│                                         │
│  가격은 적정하지만,                      │
│  사진이 8장 부족하고                     │
│  편의시설 6개를 추가하면                  │
│  상위 30%까지 올라갈 수 있습니다."        │
└─────────────────────────────────────────┘

기술적으로 구축되는 것:  (변경 사항 표시)
  ✗ Crawlee + Playwright → ✓ HTTP + Cheerio (기존 스택)
  ✗ ScraperAPI 프록시     → ✓ UA 로테이션 + 딜레이 (무료)
  ✓ Inngest 비동기 작업 파이프라인 (무료 티어)
  ✓ InsideAirbnb CSV 활용 (무료 데이터)
  ✓ 비교군 자동 생성 엔진
  ✓ 편의시설 빈도 분석기
  ✓ 가격 벤치마킹 엔진
  ✓ 경쟁력 스코어카드 생성기
  ✓ 7개 신규 API 엔드포인트
  ✓ 포털 UI 3곳 업데이트
  ✓ 12개 신규 소스 파일

  월 비용: ~$5 (Firestore만)
```

---

## 5. Phase 2~4 변경 요약

### 5.1 Phase 2 변경 — AI 모델 전환

```
리뷰 감성/토픽 분석:
  원본: GPT-4o-mini ($5~15/mo)
  변경: Groq 무료 (Llama 3.3 70B)
       → 하루 500K 토큰 (월 15M) 무료
       → 100 숙소 × 50 리뷰 배치 처리에 충분
       → Structured Output으로 JSON 응답

사진 분석:
  원본: GPT-4o Vision ($10~30/mo)
  변경: Phase 2에서는 AI 사진 분석 제외
       → Sharp로 해상도/밝기 체크 ($0)
       → 사진 수량 비교 ($0)
       → 필요 시 Google Cloud Vision 무료 (1,000장/mo)

AI Fallback 체인:
  1순위: Groq 무료 (Llama 3.3 70B)     → 리뷰 분석, 토픽 추출
  2순위: DeepSeek V3 ($0.28/1M 토큰)    → Groq 장애 시
  3순위: GPT-4o-mini ($0.15/1M 토큰)    → 최후 수단
```

```typescript
// src/lib/ai/provider.ts — Fallback 체인

export async function analyzeReviews(reviews: string[]): Promise<ReviewAnalysis> {
  // 1순위: Groq 무료
  try {
    return await groqAnalyze(reviews)
  } catch (e) {
    console.warn("Groq failed, falling back to DeepSeek", e)
  }

  // 2순위: DeepSeek (극저가)
  try {
    return await deepseekAnalyze(reviews)
  } catch (e) {
    console.warn("DeepSeek failed, falling back to GPT-4o-mini", e)
  }

  // 3순위: GPT-4o-mini (확실한 동작)
  return await openaiAnalyze(reviews)
}
```

### 5.2 Phase 3 변경 — 제목/설명 생성

```
원본: Claude Sonnet ($15~30/mo)
변경: Gemini 2.5 Flash 무료 (250 req/day = 7,500/mo)

  100 숙소 × 4 생성 (제목 3개 + 설명 1개) = 400 req/mo
  → 무료 한도 7,500의 5%만 사용

  Gemini 2.5 Flash 한국어 품질:
  - 마케팅 카피 생성에 양호
  - Claude Sonnet 대비 약간 뒤처지나 실용적 수준
  - 무료로 충분한 품질 확보

이벤트 데이터:
  원본: PredictHQ API ($0~50/mo)
  변경: 공휴일 DB (date-holidays 패키지, 무료)
       + 관리자가 주요 이벤트 수동 등록
       → Phase 3 MVP에 충분
```

### 5.3 Phase 4 변경 — Firestore 집계

```
원본: BigQuery ($5~20/mo)
변경: Firestore 월간/일간 집계 문서 ($0 추가)

  데이터 구조:
  properties/{id}/analytics-monthly/{YYYY-MM}
    → 12개 문서 읽기로 연간 트렌드 차트 표시
    → 12 reads × 100 숙소 = 1,200 reads/mo ($0.00072)

  properties/{id}/analytics-daily/{YYYY-MM-DD}
    → 최근 90일만 유지 (Firestore TTL 자동 삭제)
    → 일별 상세 차트용

  대시보드: Recharts 유지 (Tremor 불필요)
  리포트: Phase 4 MVP에서 PDF 내보내기 필요 시에만 @react-pdf 추가
```

---

## 6. 리스크 & 대응 전략

### 6.1 스크래핑 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Airbnb가 data-deferred-state 구조 변경 | 중 | 중 | JSON 경로만 업데이트 (구조 자체는 유지될 가능성 높음) |
| IP 차단 (프록시 없이) | 낮~중 | 중 | 자동 백오프 → Bright Data 종량제 $8/mo 추가 |
| InsideAirbnb 서비스 중단 | 낮 | 낮 | 직접 스크래핑으로 전환 (원본 계획 Step B로 복귀) |
| Vercel 60초 내 처리 실패 | 낮 | 낮 | Inngest step으로 분할 (이미 설계됨) |

### 6.2 AI 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Groq 무료 티어 축소/폐지 | 중 | 낮 | Fallback 체인 → DeepSeek $3/mo |
| Gemini 무료 티어 축소 | 중 | 낮 | Fallback → DeepSeek 또는 GPT-4o-mini |
| 무료 모델 한국어 품질 부족 | 낮 | 중 | A/B 테스트 후 필요 시 유료 전환 |
| Rate limit 도달 | 낮 | 낮 | 배치 처리 + 캐싱으로 호출 수 최소화 |

### 6.3 인프라 리스크

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Vercel Hobby 한도 초과 | 낮 | 중 | Hetzner VPS $4/mo로 전환 (Pro $20보다 저렴) |
| Inngest 무료 한도 초과 | 낮 | 낮 | 100 숙소에서 8K/25K 사용. 200+ 숙소 시 유료 전환 |
| Firestore 비용 급증 | 낮 | 중 | 읽기 캐싱 + 집계 쿼리 활용. 500 숙소까지 $10 이내 |

### 6.4 비용 업그레이드 경로

```
숙소 수 증가에 따른 예상 비용:

  ~50 숙소:   $5/mo   (모든 무료 티어 내)
  ~100 숙소:  $10/mo  (Firestore 증가)
  ~200 숙소:  $20/mo  (Inngest 유료 $25 또는 QStash 유지)
  ~500 숙소:  $50/mo  (프록시 필요, AI 유료 전환)
  ~1000 숙소: $150/mo (Vercel Pro 또는 VPS, BigQuery 검토)

  → 1000 숙소에서도 원본 계획의 100 숙소 비용($200)보다 저렴
```

---

## 부록: 원본 계획과 동일한 부분

아래 내용은 원본 `20260311.md`에서 변경 없이 그대로 적용:
- §1 경쟁사 벤치마킹 요약 (전체)
- §2.1 5단계 파이프라인 구조 (전체)
- §2.2 경쟁사 대비 차별점 (전체)
- §2.3 구현 우선순위 (전체)
- §4.5 편의시설 격차 분석 로직 (전체)
- §4.6 가격 벤치마킹 로직 (전체)
- §4.7 경쟁력 스코어카드 (전체)
- §4.9 API 엔드포인트 (6개 + 2개 추가)
- §4.10 포털 UI 변경 (전체)
- 모든 TypeScript 타입 정의 (ScrapedListing, CompSetCriteria, AmenityAnalysis, PriceBenchmark)
