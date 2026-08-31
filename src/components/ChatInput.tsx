'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSubmit,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e);
      }
    }
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-md border-t border-neutral-200 p-3 sm:p-4">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={onSubmit}
          className="relative flex items-end rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xs focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="김천중학교에 대해 무엇이든 물어보세요 (예: 오늘 급식, 학사일정, 시설 안내...)"
            disabled={isLoading}
            className="max-h-40 min-h-[44px] w-full resize-none bg-transparent px-3.5 py-2.5 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white transition-all hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 disabled:cursor-not-allowed mb-0.5 mr-0.5"
            title="메시지 전송"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-2 text-center text-[11px] text-neutral-400">
          김천중학교 공식 데이터 기반 AI 안내 시스템입니다 · 최신 정보는 공지사항을 확인하세요
        </p>
      </div>
    </div>
  );
};
