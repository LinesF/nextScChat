'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import { User, Copy, Check } from 'lucide-react';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, isStreaming }) => {
  const [copied, setCopied] = React.useState(false);
  const isUser = role === 'user';

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group flex w-full gap-3 py-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white shadow-xs">
          <Image
            src="/songseol_logo.png"
            alt="Songseol"
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      )}

      <div
        className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all ${
          isUser
            ? 'bg-neutral-900 text-white shadow-xs'
            : 'bg-white border border-neutral-200/90 text-neutral-800 shadow-xs'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="markdown-content prose prose-sm max-w-none text-neutral-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="mb-2.5 list-disc pl-4 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="mb-2.5 list-decimal pl-4 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-neutral-900">{children}</strong>,
                h1: ({ children }) => <h1 className="text-base font-bold text-neutral-900 mt-3 mb-1.5">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-neutral-900 mt-2.5 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-neutral-900 mt-2 mb-1">{children}</h3>,
                table: ({ children }) => (
                  <div className="my-2.5 overflow-x-auto rounded border border-neutral-200">
                    <table className="min-w-full text-xs text-left divide-y divide-neutral-200">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="bg-neutral-50 px-2.5 py-1.5 font-semibold text-neutral-700">{children}</th>,
                td: ({ children }) => <td className="px-2.5 py-1.5 border-t border-neutral-100">{children}</td>,
                code: ({ children }) => (
                  <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs text-neutral-800 font-mono">
                    {children}
                  </code>
                ),
              }}
            >
              {content || (isStreaming ? '답변을 생성하고 있습니다...' : '')}
            </ReactMarkdown>

            {isStreaming && (
              <span className="inline-block h-4 w-1.5 translate-y-0.5 bg-neutral-600 animate-pulse ml-0.5" />
            )}

            {!isStreaming && content && (
              <div className="mt-2 flex items-center justify-end border-t border-neutral-100 pt-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={handleCopy}
                  type="button"
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-medium">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-600">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
