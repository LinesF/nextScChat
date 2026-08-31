import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '김천중학교 AI 안내 챗봇 | 송설',
  description: '송설의 얼과 기상 · 질문에 특화된 김천중학교 공식 AI 안내 챗봇 (실시간 급식, 학사일정, 시설 안내)',
  icons: {
    icon: '/songseol_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-neutral-50/60 text-neutral-900 antialiased selection:bg-neutral-200">
        {children}
      </body>
    </html>
  );
}
