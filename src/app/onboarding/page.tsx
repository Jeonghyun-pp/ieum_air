'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, ArrowLeft, Check, Building2, ClipboardList, CreditCard, PartyPopper, Loader2 } from 'lucide-react';

const steps = [
  { label: '숙소 정보', icon: Building2 },
  { label: '현재 상황', icon: ClipboardList },
  { label: '플랜 선택', icon: CreditCard },
  { label: '완료', icon: PartyPopper },
];

const propertyTypes = ['아파트/원룸', '단독주택', '펜션/별장', '호텔/리조트', '게스트하우스'];
const regions = ['서울', '부산', '제주', '강원', '경기', '기타'];
const bookingRanges = ['5건 미만', '5~10건', '10~20건', '20건 이상'];
const nationalities = ['한국인 위주', '일본인 많음', '중국/대만 많음', '서양권 많음', '잘 모르겠음'];
const currentActivities = ['아무것도 안 함', 'SNS 가끔 올림', '블로그 운영', '유료 광고 집행'];
const painPoints = ['예약이 안 됨', '리뷰가 적음', '홍보 방법을 모름', '시간이 없음'];

const plans = [
  { name: '베이직', price: '20만원/월', features: ['리스팅 최적화', '월 4회 콘텐츠', '촬영 가이드'] },
  { name: '스탠다드', price: '35만원/월', features: ['베이직 전체', '블로그 SEO', '다국어 번역', '채널 전략'], highlighted: true },
  { name: '프리미엄', price: '55만원/월', features: ['스탠다드 전체', '가격 캘린더', '월 8회 콘텐츠', '전담 매니저'] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { firebaseUser, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyName: '',
    region: '',
    propertyType: '',
    listingUrl: '',
    monthlyBookings: '',
    guestNationality: '',
    currentActivity: '',
    painPoint: '',
    selectedPlan: '',
  });

  // Auth guard: 비로그인 시 랜딩으로 리다이렉트
  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      router.replace('/');
    }
  }, [authLoading, firebaseUser, router]);

  const next = async () => {
    if (step === 2) {
      // 플랜 선택 → 완료: API로 데이터 저장
      await saveProperty();
    } else {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const selectChip = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const saveProperty = async () => {
    if (!firebaseUser) {
      setError('로그인이 필요합니다. 먼저 로그인해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.propertyName,
          region: form.region,
          propertyType: form.propertyType,
          listingUrl: form.listingUrl || undefined,
          monthlyBookings: form.monthlyBookings,
          guestNationality: form.guestNationality,
          currentActivity: form.currentActivity,
          painPoint: form.painPoint,
          selectedPlan: form.selectedPlan,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to save property');
      }

      setCreatedPropertyId(data.data.id);

      // 리스팅 URL이 있으면 스크래핑 트리거
      if (form.listingUrl) {
        try {
          await fetch(`/api/properties/${data.data.id}/scrape`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch {
          // 스크래핑 실패는 무시 — 비동기 처리
        }
      }

      setStep(3);
    } catch (err: any) {
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
        selected
          ? 'bg-accent-gradient text-white'
          : 'bg-dark-highlight text-[#B3B3B3] hover:text-white hover:bg-dark-highlight/80'
      }`}
    >
      {label}
    </button>
  );

  if (authLoading) {
    return (
      <div className="dark min-h-screen bg-dark-base text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!firebaseUser) {
    return null; // 리다이렉트 중
  }

  return (
    <div className="dark min-h-screen bg-dark-base text-white flex flex-col items-center justify-center px-4 py-12">
      {/* Progress bar */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i < step ? 'bg-emerald-500 text-white' :
                  i === step ? 'bg-accent-gradient text-white' :
                  'bg-dark-highlight text-[#6A6A6A]'
                }`}>
                  {i < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 lg:w-24 h-0.5 ${
                    i < step ? 'bg-emerald-500' : 'bg-dark-highlight'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center text-sm text-[#6A6A6A]">
          {steps[step].label} ({step + 1}/{steps.length})
        </div>
      </div>

      {/* Step content */}
      <div className="w-full max-w-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8 rounded-2xl bg-dark-elevated"
          >
            {/* Step 1: Property Info */}
            {step === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">숙소 정보를 알려주세요</h2>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">숙소 이름</label>
                  <input
                    value={form.propertyName}
                    onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
                    placeholder="예: 제주 오션뷰 리조트"
                    className="w-full px-4 py-3 rounded-xl bg-dark-highlight border-0 text-sm placeholder:text-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">지역</label>
                  <div className="flex flex-wrap gap-2">
                    {regions.map((r) => (
                      <Chip key={r} label={r} selected={form.region === r} onClick={() => selectChip('region', r)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">숙소 유형</label>
                  <div className="flex flex-wrap gap-2">
                    {propertyTypes.map((t) => (
                      <Chip key={t} label={t} selected={form.propertyType === t} onClick={() => selectChip('propertyType', t)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">에어비앤비 리스팅 URL (선택)</label>
                  <input
                    value={form.listingUrl}
                    onChange={(e) => setForm({ ...form, listingUrl: e.target.value })}
                    placeholder="https://airbnb.com/rooms/..."
                    className="w-full px-4 py-3 rounded-xl bg-dark-highlight border-0 text-sm placeholder:text-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Diagnosis */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">현재 상황을 알려주세요</h2>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">월 평균 예약 수</label>
                  <div className="flex flex-wrap gap-2">
                    {bookingRanges.map((r) => (
                      <Chip key={r} label={r} selected={form.monthlyBookings === r} onClick={() => selectChip('monthlyBookings', r)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">주요 게스트 국적</label>
                  <div className="flex flex-wrap gap-2">
                    {nationalities.map((n) => (
                      <Chip key={n} label={n} selected={form.guestNationality === n} onClick={() => selectChip('guestNationality', n)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">현재 홍보 활동</label>
                  <div className="flex flex-wrap gap-2">
                    {currentActivities.map((a) => (
                      <Chip key={a} label={a} selected={form.currentActivity === a} onClick={() => selectChip('currentActivity', a)} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-[#B3B3B3] mb-2 block">가장 어려운 점</label>
                  <div className="flex flex-wrap gap-2">
                    {painPoints.map((p) => (
                      <Chip key={p} label={p} selected={form.painPoint === p} onClick={() => selectChip('painPoint', p)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">플랜을 선택하세요</h2>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.name}
                      onClick={() => selectChip('selectedPlan', plan.name)}
                      className={`w-full p-5 rounded-xl text-left transition-all duration-200 ${
                        form.selectedPlan === plan.name
                          ? 'bg-dark-surface ring-2 ring-purple-500'
                          : 'bg-dark-highlight hover:bg-dark-highlight/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-sm text-accent-purple font-bold">{plan.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((f) => (
                          <span key={f} className="text-xs text-[#6A6A6A]">{f}</span>
                        ))}
                      </div>
                      {plan.highlighted && form.selectedPlan !== plan.name && (
                        <span className="inline-block mt-2 text-xs text-purple-400">추천</span>
                      )}
                    </button>
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 3 && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <PartyPopper className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">등록 완료!</h2>
                  <p className="text-sm text-[#B3B3B3]">
                    곧 숙소 진단 결과와 함께 첫 번째 전략 브리프를 받아보실 수 있습니다.
                  </p>
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  rounded="full"
                  className="px-8"
                  onClick={() => router.push('/portal')}
                >
                  포털로 이동
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        {step < 3 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0}
              className="text-[#B3B3B3] hover:text-white disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              이전
            </Button>
            <Button
              variant="gradient"
              onClick={next}
              rounded="full"
              className="px-6"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  {step === 2 ? '완료' : '다음'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
