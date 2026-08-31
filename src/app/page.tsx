'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { ChatMessage, ChatMessageProps } from '@/components/ChatMessage';
import { QuickPrompts } from '@/components/QuickPrompts';
import { ChatInput } from '@/components/ChatInput';
import { Sparkles, MessageSquare } from 'lucide-react';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isLoading) return;

    const newMessages: ChatMessageProps[] = [
      ...messages,
      { role: 'user', content: userPrompt },
    ];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Add empty assistant placeholder for streaming
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', isStreaming: true },
      ]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error('네트워크 응답 오류');
      }

      if (!response.body) {
        throw new Error('응답 바디 없음');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        streamedContent += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
            updated[lastIdx] = {
              role: 'assistant',
              content: streamedContent,
              isStreaming: true,
            };
          }
          return updated;
        });
      }

      // Mark streaming as complete
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            role: 'assistant',
            content: streamedContent,
            isStreaming: false,
          };
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
          updated[lastIdx] = {
            role: 'assistant',
            content: '죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
            isStreaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const handleResetChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <Header onReset={handleResetChat} messageCount={messages.length} />

      {/* Main Chat Container */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center pt-8 sm:pt-16 text-center">
              {/* Center Logo */}
              <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-neutral-200 bg-neutral-50/80 p-3 shadow-xs">
                <Image
                  src="/songseol_logo.png"
                  alt="김천중학교"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                />
              </div>

              <h2 className="text-xl font-bold text-neutral-900 tracking-tight sm:text-2xl">
                김천중학교 AI 안내 챗봇
              </h2>
              <p className="mt-2 max-w-md text-xs sm:text-sm text-neutral-500 leading-relaxed">
                오늘의 급식 식단, 다가오는 학사일정, 시설 안내, 교원 및 학생 통계 등 학교 생활에 관한 모든 것을 물어보세요.
              </p>

              {/* Quick Prompts */}
              <div className="mt-8 w-full max-w-2xl">
                <QuickPrompts
                  onSelectPrompt={(p) => handleSendMessage(p)}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>
      </main>

      {/* Chat Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
