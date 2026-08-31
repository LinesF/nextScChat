'use client';

import React from 'react';
import Image from 'next/image';
import { RotateCcw, Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  messageCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onReset, messageCount }) => {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-xs">
            <Image
              src="/songseol_logo.png"
              alt="김천중학교 송설 엠블럼"
              width={36}
              height={36}
              className="object-contain"
              priority
              onError={(e) => {
                // Fallback if image fails to render
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
                김천중학교 AI 안내
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              송설의 얼과 기상 · 실시간 급식 및 학교생활 안내
            </p>
          </div>
        </div>

        {messageCount > 0 && (
          <button
            onClick={onReset}
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100"
            title="대화 초기화"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">새 대화</span>
          </button>
        )}
      </div>
    </header>
  );
};
