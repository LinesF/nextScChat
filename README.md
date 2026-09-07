# 김천중학교 AI 안내 챗봇 (nextScChat)

유서 깊은 민족사학 **김천중학교**를 소개하고 질문에 특화된 응답을 제공하는 **RAG 기반 AI 챗봇 웹 애플리케이션**입니다.

---

## ✨ 주요 기능
- **단정하고 미니멀한 화이트 UI**: 집중도를 높이는 정돈된 레이아웃 및 반응형 디자인
- **RAG 기반 질문 답변**: 김천중학교 공식 통계, 시설, 연혁, 동아리, 사수삼강 등 정형 지식 베이스 탑재
- **실시간 급식 & 학사일정 연동**: 교육부 나이스(NEIS) Open API 연동 및 자동 Fallback 데이터셋 제공
- **Google Gemini 2.0 Flash 스트리밍**: 끊김 없는 실시간 타이핑 효과
- **Cloudflare Pages & GitHub 배포 최적화**: 서버리스 엣지 환경에 최적화된 구조

---

## 🛠️ 기술 스택
- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide React
- **마크다운 렌더링**: `react-markdown`, `remark-gfm`
- **AI 모델**: Google Gemini 2.0 Flash (`@google/generative-ai`)
- **데이터 레이어**: NEIS Open API + JSON 기반 지식 베이스

---

## 🔑 필수 및 선택 API 키 발급 안내

| API 명 | 용도 | 공식 발급 URL | 비용 및 특징 |
| :--- | :--- | :--- | :--- |
| **OpenRouter API** (필수) | DeepSeek V4 Flash 등 최신 LLM 추론 | [openrouter.ai/keys](https://openrouter.ai/keys) | 가입 즉시 키 생성, 다양한 최신 오픈/상용 모델 지원 |
| **교육부 NEIS Open API** (선택) | 실시간 급식 식단 및 학사일정 동기화 | [open.neis.go.kr](https://open.neis.go.kr) | 완전 무료, 가입 후 '일반 인증키' 신청 즉시 자동 발급 |
| **학교알리미 API** (데이터 보강용) | 학생/교원 수, 시설 현황 등 정형 통계 | [schoolinfo.go.kr](https://www.schoolinfo.go.kr/openApi.do) | 완전 무료 공공 데이터 포털 |
| **Google AI Studio** (대체/백업용) | Gemini 모델 직접 호출 | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | 무료 티어(Free tier) 넉넉하게 제공 |

---

## 🚀 로컬 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 OpenRouter API 키를 입력합니다.
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731
NEIS_API_KEY=your_neis_key_optional
```

### 3. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

---

## 🌐 GitHub & Cloudflare Pages 배포 가이드

### 1. GitHub에 푸시
```bash
git init
git add .
git commit -m "feat: 김천중학교 AI 챗봇 프로젝트 구축"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Cloudflare Pages 연동
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) 로그인 후 **Workers & Pages > Create application > Pages > Connect to Git** 클릭
2. 본 GitHub 저장소(`nextScChat`) 선택
3. **빌드 설정 (Build Settings)**:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages` 또는 `npm run build`
   - **Build output directory**: `.vercel/output/static` 또는 `out`
4. **환경 변수 (Environment variables)** 등록:
   - `GOOGLE_API_KEY`: Google Gemini API Key
   - `NODE_VERSION`: `20`
5. **Deploy** 버튼을 누르면 약 1분 후 글로벌 CDN에 자동 배포됩니다.
