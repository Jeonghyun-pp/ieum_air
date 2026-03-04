'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/auth';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { googleSignIn, handleGoogleSignInRedirect } from '@/lib/auth/googleAuth';

// ============================================
// Types
// ============================================

export type UserRole = 'advertiser' | 'influencer' | 'admin';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyName?: string; // advertiser
  nickname?: string; // influencer
  followerCount?: number; // influencer
  photoURL?: string;
  bio?: string; // 한 줄 소개
}

// ============================================
// Context
// ============================================

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  isLoggedIn: boolean;

  // Auth Methods
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;

  // Helpers
  getMyPagePath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore에서 사용자 정보 가져오기
  const fetchUserData = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    try {
      const token = await fbUser.getIdToken();
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success && data.data) {
        return {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: data.data.displayName || fbUser.displayName || '',
          role: data.data.role as UserRole,
          companyName: data.data.profile?.companyName,
          nickname: data.data.profile?.nickname,
          followerCount: data.data.profile?.followerCount,
          photoURL: data.data.profile?.photoURL || fbUser.photoURL || undefined,
          bio: data.data.profile?.bio,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      return null;
    }
  }, []);

  // Firebase Auth 상태 구독
  useEffect(() => {
    const auth = getFirebaseAuth();

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Firebase 인증됨 -> Firestore에서 사용자 정보 가져오기
        const userData = await fetchUserData(fbUser);
        setUser(userData);
      } else {
        // 로그아웃 상태
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  // 이메일/비밀번호 로그인
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged가 자동으로 user 상태 업데이트
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error; // 에러를 상위로 전파해서 UI에서 처리
    }
  }, []);

  // 이메일/비밀번호 회원가입
  const signup = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      setIsLoading(true);
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      // Firestore 사용자 문서 생성
      const token = await cred.user.getIdToken();
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, displayName, role: 'advertiser', authProvider: 'password' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Signup failed');
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  // Google 로그인
  const signInWithGoogleFn = useCallback(async (): Promise<{ isNewUser: boolean }> => {
    try {
      const result = await googleSignIn();
      if (!result.success) {
        throw new Error(result.error?.message || 'Google 로그인에 실패했습니다.');
      }
      if (result.user && result.isNewUser) {
        // 신규 유저: Firestore 문서 생성
        const token = await result.user.getIdToken();
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            email: result.user.email,
            displayName: result.user.displayName || '',
            role: 'advertiser',
            authProvider: 'google.com',
          }),
        });
        const data = await res.json();
        if (!data.success && data.error?.code !== 'DUPLICATE_USER') {
          throw new Error(data.error?.message || 'Signup failed');
        }
      }
      return { isNewUser: !!result.isNewUser };
    } catch (error) {
      throw error;
    }
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
      // onAuthStateChanged가 자동으로 user를 null로 설정
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }, []);

  // 사용자 정보 새로고침
  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      setUser(userData);
    }
  }, [firebaseUser, fetchUserData]);

  // Google redirect 결과 처리
  useEffect(() => {
    handleGoogleSignInRedirect().then(async (result) => {
      if (result && result.success && result.user && result.isNewUser) {
        const token = await result.user.getIdToken();
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            email: result.user.email,
            displayName: result.user.displayName || '',
            role: 'advertiser',
            authProvider: 'google.com',
          }),
        });
        const data = await res.json();
        if (!data.success && data.error?.code !== 'DUPLICATE_USER') {
          console.error('Google redirect signup error:', data.error);
        }
      }
    });
  }, []);

  // 역할별 마이페이지 경로
  const getMyPagePath = useCallback(() => {
    if (!user) return '/';

    switch (user.role) {
      case 'advertiser':
        return '/portal';
      case 'influencer':
        return '/influencer/mypage';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    firebaseUser,
    isLoading,
    isLoggedIn: !!user,
    login,
    signup,
    signInWithGoogle: signInWithGoogleFn,
    logout,
    refreshUser,
    getMyPagePath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
