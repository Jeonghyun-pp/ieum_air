'use client';

import { useState } from 'react';
import { Upload, CheckCircle2, Circle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePortal } from '@/contexts/PortalContext';
import { usePortalData } from '@/hooks/usePortalData';
import { PortalSkeleton } from '@/components/portal/PortalSkeleton';
import { useAuth } from '@/contexts/AuthContext';

interface Todo {
  id: string;
  title: string;
  due: string;
  required: boolean;
  status: 'pending' | 'completed';
}

interface AssetsData {
  todos: Todo[];
  files: { id: string; fileName: string; fileUrl: string; fileSize: number }[];
  messages: { id: string; subject: string; body: string }[];
}

export default function AssetsPage() {
  const { activeProperty, currentMonth } = usePortal();
  const { firebaseUser } = useAuth();
  const { data, isLoading, refetch } = usePortalData<AssetsData>({
    endpoint: 'assets',
    propertyId: activeProperty?.id,
    month: currentMonth,
  });

  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (isLoading) {
    return <PortalSkeleton />;
  }

  const todos = data?.todos || [];

  const sendMessage = async () => {
    if (!firebaseUser || !messageSubject.trim() || !messageBody.trim()) return;

    setIsSending(true);
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams();
      if (activeProperty?.id) params.set('propertyId', activeProperty.id);

      await fetch(`/api/portal/assets?${params}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'message',
          subject: messageSubject,
          body: messageBody,
        }),
      });

      setMessageSubject('');
      setMessageBody('');
      refetch();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">자료</h1>
        <p className="text-[#B3B3B3]">할 일 확인, 파일 업로드, 문의하기</p>
      </div>

      {/* Todo list */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h3 className="text-sm font-semibold mb-4">할 일 리스트</h3>
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-highlight transition-colors"
            >
              {todo.status === 'completed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-[#6A6A6A] shrink-0" />
              )}
              <span className={`flex-1 text-sm ${
                todo.status === 'completed' ? 'text-[#6A6A6A] line-through' : ''
              }`}>
                {todo.title}
              </span>
              {todo.required && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                  필수
                </span>
              )}
              <span className="text-xs text-[#6A6A6A]">{todo.due}</span>
            </div>
          ))}
        </div>
      </div>

      {/* File upload */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h3 className="text-sm font-semibold mb-4">파일 업로드</h3>
        <div className="border-2 border-dashed border-dark-highlight rounded-xl p-8 text-center hover:border-purple-500/30 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-[#6A6A6A] mx-auto mb-3" />
          <p className="text-sm text-[#B3B3B3] mb-1">파일을 드래그하거나 클릭하여 업로드</p>
          <p className="text-xs text-[#6A6A6A]">JPG, PNG, PDF (최대 10MB)</p>
        </div>
        <div className="mt-4 text-sm text-[#6A6A6A]">
          아직 업로드된 파일이 없습니다.
        </div>
      </div>

      {/* Contact */}
      <div className="p-6 rounded-2xl bg-dark-elevated">
        <h3 className="text-sm font-semibold mb-4">문의하기</h3>
        <div className="space-y-4">
          <input
            type="text"
            value={messageSubject}
            onChange={(e) => setMessageSubject(e.target.value)}
            placeholder="문의 제목"
            className="w-full px-4 py-3 rounded-xl bg-dark-highlight border-0 text-sm placeholder:text-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            placeholder="문의 내용을 입력하세요"
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-dark-highlight border-0 text-sm placeholder:text-[#6A6A6A] focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
          <Button
            variant="gradient"
            className="flex items-center gap-2"
            onClick={sendMessage}
            disabled={isSending}
          >
            <Send className="w-4 h-4" />
            {isSending ? '전송 중...' : '전송하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
