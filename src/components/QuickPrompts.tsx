'use client';

import React from 'react';
import { Utensils, Calendar, Building2, Trees, Users, GraduationCap } from 'lucide-react';

interface QuickPromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

const PROMPTS = [
  {
    icon: Utensils,
    label: '오늘 급식 메뉴',
    query: '오늘 김천중학교 점심 급식 메뉴와 칼로리 알려줘',
  },
  {
    icon: Calendar,
    label: '다가오는 학사일정',
    query: '앞으로 예정된 주요 학사일정(시험, 방학 등) 알려줘',
  },
  {
    icon: Building2,
    label: '학교 시설 & 위치',
    query: '김천중학교 위치, 교실, 체육관, 도서관 시설 현황 알려줘',
  },
  {
    icon: Trees,
    label: '건학이념 & 사수삼강',
    query: '김천중학교의 설립 역사와 교훈인 사수삼강(四修三綱)의 뜻을 설명해줘',
  },
  {
    icon: Users,
    label: '학생 & 교원 현황',
    query: '김천중학교 전교생 수, 학급 수, 선생님 통계를 알려줘',
  },
  {
    icon: GraduationCap,
    label: '동아리 & 방과후 활동',
    query: '김천중학교에서 운영 중인 동아리와 방과후 프로그램 알려줘',
  },
];

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ onSelectPrompt, disabled }) => {
  return (
    <div className="w-full py-4">
      <p className="mb-3 text-xs font-medium text-neutral-400">자주 묻는 질문 바로가기</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.query)}
              disabled={disabled}
              type="button"
              className="flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-white p-3 text-left transition-all hover:border-neutral-300 hover:bg-neutral-50/80 active:bg-neutral-100 disabled:opacity-50 shadow-2xs"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-neutral-800 truncate">
                  {item.label}
                </span>
                <span className="block text-[11px] text-neutral-400 truncate">
                  {item.query}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
