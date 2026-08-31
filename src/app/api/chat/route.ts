import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildRagContext, getSystemInstruction } from '@/lib/rag';

export const runtime = 'nodejs'; // or 'edge'

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

    const apiKey = process.env.GOOGLE_API_KEY?.trim();

    if (!apiKey) {
      // Return a polite fallback response if API key is not yet set
      const mockResponse = `안녕하세요! 김천중학교 안내 챗봇입니다.\n\n현재 AI API 키가 설정되지 않아 기본 안내 모드로 작동 중입니다.\n\n${ragContext.split('[김천중학교 공식 팩트 정보]')[0]}\n\n더 궁금한 점이 있으시면 문의해 주세요!`;
      return new Response(mockResponse, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction,
    });

    // Format chat history for Gemini
    const history = messages.slice(0, -1).map((m: Message) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: history,
    });

    const result = await chat.sendMessageStream(lastUserMessage);

    // Create a ReadableStream to stream text back to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
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
