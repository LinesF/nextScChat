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

## 🚀 로컬 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.example` 파일을 복사하여 `.env.local` 파일을 생성하고 Google Gemini API 키를 입력합니다.
```env
GOOGLE_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash
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
