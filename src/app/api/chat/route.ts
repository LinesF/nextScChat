import { NextRequest, NextResponse } from 'next/server';
import { buildRagContext, getSystemInstruction } from '@/lib/rag';

export const runtime = 'nodejs';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: '메시지가 전달되지 않았습니다.' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    const ragContext = await buildRagContext(lastUserMessage);
    const systemInstruction = getSystemInstruction(ragContext);

    const openRouterApiKey = process.env.OPENROUTER_API_KEY?.trim();
    const modelName = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v4-flash-0731';

    if (!openRouterApiKey) {
      const mockResponse = `안녕하세요! 김천중학교 안내 챗봇입니다.\n\n현재 OpenRouter API 키가 설정되지 않아 기본 안내 모드로 작동 중입니다.\n\n${ragContext.split('[김천중학교 공식 팩트 정보]')[0]}\n\n더 궁금한 점이 있으시면 문의해 주세요!`;
      return new Response(mockResponse, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Build OpenAI-compatible messages array for OpenRouter
    const chatMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m: Message) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Gimcheon Middle School AI Chatbot',
      },
      body: JSON.stringify({
        model: modelName,
        messages: chatMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error Response:', errorText);
      return NextResponse.json(
        { error: `OpenRouter API 호출 오류 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    if (!response.body) {
      return NextResponse.json({ error: 'OpenRouter 응답 바디가 비어있습니다.' }, { status: 500 });
    }

    // Transform OpenRouter SSE stream to plain text stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = '';

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last incomplete line in buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':')) continue; // Ignore empty lines or SSE comments
              if (trimmed === 'data: [DONE]') continue;

              if (trimmed.startsWith('data: ')) {
                try {
                  const json = JSON.parse(trimmed.slice(6));
                  const delta = json.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(encoder.encode(delta));
                  }
                } catch (jsonErr) {
                  // If JSON parse fails for a line, ignore or log
                }
              }
            }
          }

          // Process remaining buffer if any
          if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
            try {
              const json = JSON.parse(buffer.trim().slice(6));
              const delta = json.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(encoder.encode(delta));
              }
            } catch {}
          }

          controller.close();
        } catch (err) {
          console.error('Stream processing error:', err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error?.message || '대화 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
