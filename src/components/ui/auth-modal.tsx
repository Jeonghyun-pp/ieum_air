'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

// ============================================
// Types
// ============================================

export type AuthModalMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
}

// ============================================
// Validation
// ============================================

const signupSchema = z.object({
  displayName: z.string().min(2, '이름은 2자 이상이어야 해요'),
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 해요'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: '비밀번호가 일치하지 않아요',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

// ============================================
// Firebase Error Messages (Korean)
// ============================================

function getFirebaseErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': '이미 사용 중인 이메일이에요. 로그인을 시도해보세요.',
    'auth/invalid-email': '올바른 이메일 주소를 입력해주세요.',
    'auth/weak-password': '비밀번호가 너무 짧아요. 6자 이상으로 입력해주세요.',
    'auth/user-not-found': '등록되지 않은 이메일이에요. 회원가입을 진행해주세요.',
    'auth/wrong-password': '비밀번호가 올바르지 않아요.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않아요.',
    'auth/too-many-requests': '너무 많은 시도가 있었어요. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
    'auth/popup-closed-by-user': '로그인이 취소되었어요.',
  };
  return map[code] || '문제가 발생했어요. 다시 시도해주세요.';
}

// ============================================
// Auth Modal Component
// ============================================

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const router = useRouter();
  const { login, signup, signInWithGoogle, user, firebaseUser } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Form fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sync mode with initialMode prop
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError('');
      setFieldErrors({});
      setDisplayName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isOpen, initialMode]);

  // ESC key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // ---- Handlers ----

  const handleSignup = async () => {
    setError('');
    setFieldErrors({});
    const parsed = signupSchema.safeParse({ displayName, email, password, confirmPassword });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(email, password, displayName);
      onClose();
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.code ? getFirebaseErrorMessage(err.code) : (err.message || '회원가입에 실패했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setFieldErrors({});
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      onClose();
      // Property 유무로 온보딩 완료 여부 판단
      const { getFirebaseAuth } = await import('@/lib/firebase/auth');
      const auth = getFirebaseAuth();
      const fbUser = auth.currentUser;
      if (fbUser) {
        const token = await fbUser.getIdToken();
        const res = await fetch('/api/properties', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          router.push('/portal');
        } else {
          router.push('/onboarding');
        }
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.code ? getFirebaseErrorMessage(err.code) : (err.message || '로그인에 실패했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await signInWithGoogle();
      onClose();
      if (result.isNewUser) {
        router.push('/onboarding');
      } else {
        router.push('/portal');
      }
    } catch (err: any) {
      setError(err.code ? getFirebaseErrorMessage(err.code) : (err.message || 'Google 로그인에 실패했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup') handleSignup();
    else handleLogin();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-[60]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div
          className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Logo */}
          <div className="text-center mb-5">
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-violet-500 bg-clip-text text-transparent">
              StayTrend
            </span>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-5">
            <button
              onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setFieldErrors({}); }}
              className={`flex-1 pb-2.5 text-sm font-semibold transition-colors ${
                mode === 'signup'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  placeholder="이름"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all"
                />
                {fieldErrors.displayName && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.displayName}</p>
                )}
              </div>
            )}

            <div>
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all"
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 transition-all"
                />
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-purple-600 text-white font-semibold text-center rounded-xl hover:bg-purple-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? '처리 중...'
                : mode === 'signup'
                  ? '회원가입'
                  : '로그인'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 계속하기
          </button>
        </div>
      </div>
    </>
  );
}
