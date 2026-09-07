# AI & Developer Architecture Guide: Gimcheon Middle School AI Chatbot (`nextScChat`)

This document serves as an exhaustive technical reference for AI coding agents and human developers to understand the codebase structure, tech stack, data pipeline, and architecture of **nextScChat**.

---

## 1. Project Purpose & High-Level Summary
- **App Name**: `nextScChat` (Gimcheon Middle School AI Chatbot / 김천중학교 AI 안내 챗봇)
- **Objective**: An AI-powered chatbot website tailored specifically for Gimcheon Middle School (김천중학교) in South Korea. It answers student, parent, and visitor inquiries regarding school history/symbols (송설당 최송설헌 여사, 사수삼강), statistics (student/teacher counts), facilities, clubs, uniforms, admissions, academic calendar, and daily cafeteria meal menus (급식).
- **Core Design Philosophy**: Minimalist, clean white interface with responsive UX, ultra-low latency SSE token streaming, and hybrid RAG (dynamic live data + structured static knowledge base).

---

## 2. Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 (App Router) | React Server & Client Components, Route Handlers |
| **Language** | TypeScript (Strict mode) | Strict type checking, path aliases (`@/*` -> `./src/*`) |
| **Styling** | Tailwind CSS + Autoprefixer | Minimalist white palette, responsive utility classes |
| **Icons** | Lucide React | Clean, tree-shakeable icons (`Utensils`, `Calendar`, etc.) |
| **Markdown** | `react-markdown` + `remark-gfm` | Formatted AI output (tables, lists, bold text, code blocks) |
| **LLM Provider** | OpenRouter API | `https://openrouter.ai/api/v1/chat/completions` |
| **Default Model** | DeepSeek V4 Flash | `deepseek/deepseek-v4-flash-0731` |
| **Data & RAG** | Hybrid Intent Routing + Fallback | NEIS Open API for live meals/schedule + JSON fallback |
| **Hosting Target**| Cloudflare Pages / GitHub | Zero-cold-start Edge/Serverless deployment |

---

## 3. Directory Structure & Key Files

```text
nextScChat/
├── public/
│   └── songseol_logo.png             # Official Gimcheon Middle School (Songseol) emblem
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          # Core streaming chat endpoint (OpenRouter SSE forwarder)
│   │   ├── globals.css               # Base CSS, typography, scrollbar styling
│   │   ├── layout.tsx                # Root layout with metadata and favicon
│   │   └── page.tsx                  # Main client-side chat interface (state, SSE reader)
│   ├── components/
│   │   ├── Header.tsx                # Minimalist top navigation bar with live status indicator
│   │   ├── ChatMessage.tsx           # Render message bubble with markdown & copy-to-clipboard
│   │   ├── QuickPrompts.tsx          # 6 quick-suggestion prompt chips for common queries
│   │   └── ChatInput.tsx             # Auto-resizing textarea with enter-to-submit
│   ├── data/
│   │   ├── schoolInfo.json           # School profile, student/teacher stats, facilities, history
│   │   ├── calendar.json             # 2026 academic calendar events (cached fallback)
│   │   └── meals.json                # 2026 daily meal menus with calories (cached fallback)
│   └── lib/
│       ├── neis.ts                   # NEIS Open API fetcher for live meals & calendar + fallback
│       └── rag.ts                    # Keyword intent router & prompt context builder
├── .env.example                      # Template for required environment variables
├── .env.local                        # Local secrets (Ignored in Git)
├── .gitignore                        # Git ignore rules
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Dependencies and scripts
├── postcss.config.js                 # PostCSS setup with Tailwind & Autoprefixer
├── README.md                         # User-facing setup & deployment guide
└── tsconfig.json                     # TypeScript compiler configuration
```

---

## 4. RAG & Data Ingestion Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Page as src/app/page.tsx (Client)
    participant Route as src/app/api/chat/route.ts
    participant RAG as src/lib/rag.ts
    participant NEIS as src/lib/neis.ts / JSON
    participant LLM as OpenRouter (DeepSeek V4 Flash)

    User->>Page: Enters prompt (e.g., "오늘 급식 뭐야?")
    Page->>Route: POST /api/chat { messages: [...] }
    Route->>RAG: buildRagContext(lastUserMessage)
    
    alt User asks about Meals (급식, 메뉴 등)
        RAG->>NEIS: getMeals(todayDate) -> NEIS API or meals.json
    else User asks about Schedule (학사일정, 시험, 방학 등)
        RAG->>NEIS: getUpcomingCalendar(todayDate) -> NEIS API or calendar.json
    end

    RAG->>RAG: Append static school facts from src/data/schoolInfo.json
    RAG-->>Route: Formatted RAG Context & System Instruction
    Route->>LLM: POST /api/v1/chat/completions (stream: true)
    LLM-->>Route: SSE chunk streams (data: { choices: [{ delta: { content } }] })
    Route-->>Page: Text stream
    Page-->>User: Real-time typing display on UI
```

---

## 5. API Contracts & Conventions

### `POST /api/chat`
- **Request Format**:
  ```json
  {
    "messages": [
      { "role": "user", "content": "오늘 점심 메뉴 뭐야?" }
    ]
  }
  ```
- **Response**: `ReadableStream<Uint8Array>` (Plain text stream chunked with UTF-8 encoding).
- **Environment Variables**:
  - `OPENROUTER_API_KEY`: API key for OpenRouter (`sk-or-v1-...`).
  - `OPENROUTER_MODEL`: Model identifier (defaults to `deepseek/deepseek-v4-flash-0731`).
  - `NEIS_API_KEY`: Educational NEIS API key for live meal/calendar synchronization.

---

## 6. API Keys & Issuance Guide (API 발급처 및 상세 가이드)

프로젝트에서 활용되거나 연동 가능한 4대 API의 공식 발급처와 절차입니다.

### ① OpenRouter API Key (핵심 LLM 추론 엔진)
- **공식 발급 URL**: [https://openrouter.ai/keys](https://openrouter.ai/keys)
- **발급 방법**:
  1. OpenRouter 사이트 회원가입 및 로그인 (Google/GitHub 계정 지원).
  2. 상단 메뉴의 **Keys** 페이지로 이동 후 **Create Key** 버튼 클릭.
  3. 키 이름(예: `Gimcheon-Chatbot`) 입력 후 생성된 키(`sk-or-v1-...`)를 복사하여 보관.
  4. 필요에 따라 크레딧 충전(또는 무료 모델/기본 제공 크레딧) 후 사용.
- **환경 변수 키명**: `OPENROUTER_API_KEY`
- **사용 모델**: `deepseek/deepseek-v4-flash-0731` (또는 Claude, GPT, Gemini 등 호환 모델 지정 가능)

### ② 교육부 나이스(NEIS) Open API Key (실시간 급식 & 학사일정)
- **공식 발급 URL**: [https://open.neis.go.kr](https://open.neis.go.kr) (나이스 교육정보 개방 포털)
- **발급 방법**:
  1. 나이스 교육정보 개방 포털 사이트 회원가입 및 로그인.
  2. 상단 메뉴의 **인증키 발급/관리** > **인증키 신청** 클릭.
  3. 기본 정보 및 사용 목적 입력 후 **일반 인증키 신청** (신청 즉시 무료 자동 발급).
- **환경 변수 키명**: `NEIS_API_KEY`
- **조회 서비스**:
  - `mealServiceDietInfo`: 학교 급식 식단 정보
  - `SchoolSchedule`: 학사일정 정보

### ③ 학교알리미 Open API Key (학교 공시 통계 및 시설 데이터)
- **공식 발급 URL**: [https://www.schoolinfo.go.kr/openApi.do](https://www.schoolinfo.go.kr/openApi.do) (학교알리미 Open API)
- **발급 방법**:
  1. 학교알리미 포털 회원가입 및 로그인.
  2. Open API 이용 신청 메뉴에서 인증키 신청.
- **환경 변수 키명**: `SCHOOLINFO_API_KEY`
- **용도**: 학생 수, 교원 통계, 시설 규모, 동아리 수 등 정형 공시 데이터 수집 및 갱신

### ④ Google Gemini API Key (대체/백업용 LLM)
- **공식 발급 URL**: [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) (Google AI Studio)
- **발급 방법**:
  1. Google 계정으로 AI Studio 로그인.
  2. **Get API key** 클릭 후 새 프로젝트에서 키 생성 (무료 티어 제공).
- **환경 변수 키명**: `GOOGLE_API_KEY`
- **용도**: OpenRouter 장애 시 백업 또는 직접 Gemini 2.0 Flash 호출용

---

## 7. How to Extend or Modify

1. **Adding New School Data**:
   - Update `src/data/schoolInfo.json` with new categories or updated statistics.
   - The context builder in `src/lib/rag.ts` automatically incorporates these facts into the system instruction.
2. **Changing LLM Models / Providers**:
   - To change the OpenRouter model, adjust `OPENROUTER_MODEL` in `.env.local` or Cloudflare environment variables (e.g. `anthropic/claude-3.5-sonnet`, `openai/gpt-4o-mini`, `google/gemini-2.0-flash-001`).
3. **UI Customization**:
   - Header: `src/components/Header.tsx`
   - Quick Prompt Chips: `src/components/QuickPrompts.tsx` (edit the `PROMPTS` array)
   - Chat Bubble Styling: `src/components/ChatMessage.tsx`

