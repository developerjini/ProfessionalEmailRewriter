# 📧 직장인 메일 비서 (Professional Email Rewriter)

> **"보내기 전에 이거 돌리면 메일 퀄리티 달라집니다"**

직장 생활에서 메일 작성이 부담스러울 때, AI가 내 초안을 완성된 비즈니스 메일로 바꿔드립니다.  
**제목**과 **본문**을 분리해서 출력하여 바로 복사·붙여넣기로 사용할 수 있습니다. 🚀

---

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 🎩 **6가지 말투 설정** | 정중한 / 부드러운 / 간결한 / 친근한 / 캐주얼 / 설득력 있는 |
| 📌 **제목 + 본문 분리 출력** | 제목과 본문을 따로 복사할 수 있어 편리 |
| 🌏 **한국어 / 영어 전환** | 한국어 메일과 영어 메일 모두 지원 |
| 📋 **히스토리** | 최근 20개의 변환 기록 저장 (브라우저 로컬) |
| 🔒 **클라이언트 직접 호출** | 별도 서버 없이 Anthropic API 직접 호출 |

---

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Pretendard 폰트
- **Animation**: Motion (Framer Motion)
- **AI**: [Anthropic Claude API](https://www.anthropic.com) (`claude-sonnet-4-20250514`)

---

## 🚀 시작하기

### 1. 레포지토리 클론

```bash
git clone https://github.com/developerjini/ProfessionalEmailRewriter.git
cd ProfessionalEmailRewriter
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. Anthropic API Key 입력

- [Anthropic Console](https://console.anthropic.com/api-keys)에서 API Key 발급
- 앱 상단 입력창에 `sk-ant-...` 형식의 키 입력
- API Key는 브라우저 localStorage에만 저장되며 외부로 전송되지 않습니다

---

## 📦 빌드 & 배포

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

빌드 결과물(`dist/`)은 Vercel, Netlify, GitHub Pages 등에 정적 파일로 배포 가능합니다.

### Vercel 배포 (권장)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/developerjini/ProfessionalEmailRewriter)

---

## 💡 사용 방법

1. **API Key 입력**: Anthropic API Key를 상단에 입력
2. **말투 선택**: 상황에 맞는 말투를 사이드바에서 선택
3. **원문 입력**: 보내고 싶은 내용을 자유롭게 입력
4. **변환하기**: '비즈니스 메일로 변환' 버튼 클릭 (또는 `⌘ + Enter`)
5. **복사**: 제목·본문을 각각 또는 전체 복사하여 사용

---

## 📁 프로젝트 구조

```
ProfessionalEmailRewriter/
├── src/
│   ├── services/
│   │   └── claudeService.ts    # Anthropic Claude API 호출
│   ├── App.tsx                 # 메인 앱 컴포넌트
│   ├── main.tsx                # 엔트리포인트
│   └── index.css               # 전역 스타일
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## ⚠️ 주의사항

- API Key는 클라이언트에서 직접 사용되므로, **공개 배포 시 CORS 정책에 유의**하세요.
- 개인 사용 또는 팀 내부 사용을 권장합니다.
- Anthropic API 사용 요금이 발생할 수 있습니다.

---

## 🤝 기여하기

PR과 Issue는 언제나 환영합니다!  
버그 리포트, 기능 제안, 코드 개선 모두 환영합니다.

---

**직장인 여러분의 칼퇴를 응원합니다!** 🏃‍♂️💨

Made by [개발자지니](https://github.com/developerjini) · Powered by Claude AI
