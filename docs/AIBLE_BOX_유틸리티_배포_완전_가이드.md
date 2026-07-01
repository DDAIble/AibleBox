# AiBle BOX 유틸리티 배포 완전 가이드

새 유틸리티를 만들고 **AiBle BOX 플랫폼**(`https://aible-box.vercel.app`)에 등록·배포하기까지의 **전체 과정**을 처음부터 끝까지 정리한 문서입니다.

> 이 문서 하나만 따라 하면, 유틸리티 프로젝트 준비 → Vercel 배포 → aible-box 연동 → 검증까지 완료할 수 있습니다.

---

## 목차

1. [아키텍처 이해](#1-아키텍처-이해)
2. [사전 준비 (슬러그·포트·도메인 결정)](#2-사전-준비-슬러그포트도메인-결정)
3. [유틸리티 프로젝트 개발 (필수 코드)](#3-유틸리티-프로젝트-개발-필수-코드)
4. [유틸리티 Vercel 배포 & 환경 변수](#4-유틸리티-vercel-배포--환경-변수)
5. [aible-box 플랫폼 연동](#5-aible-box-플랫폼-연동)
6. [aible-box Vercel 환경 변수](#6-aible-box-vercel-환경-변수)
7. [배포 순서 & 검증 체크리스트](#7-배포-순서--검증-체크리스트)
8. [로컬 통합 개발](#8-로컬-통합-개발)
9. [트러블슈팅](#9-트러블슈팅)
10. [현재 운영 중인 유틸리티 참고표](#10-현재-운영-중인-유틸리티-참고표)
11. [부록: GitHub Pages (정적 미러)](#11-부록-github-pages-정적-미러)

---

## 1. 아키텍처 이해

### 1-1. 게이트웨이 패턴

직원·사용자에게는 **도메인 하나**만 안내합니다.

```
https://aible-box.vercel.app/
```

각 유틸리티는 **별도 Git 레포 + 별도 Vercel 프로젝트**로 배포되지만, aible-box의 `vercel.json` **rewrite**가 하위 경로 요청을 각 유틸리티로 프록시합니다.

```
사용자
  │
  ├─> https://aible-box.vercel.app/              aible-box (플랫폼 홈, 카드 목록)
  │
  ├─> https://aible-box.vercel.app/chat/         rewrite → seesign-chat.vercel.app/chat
  │
  └─> https://aible-box.vercel.app/admission/    rewrite → admissions-extractor.vercel.app/admission
```

### 1-2. 핵심 원리 3가지

| # | 원리 | 설명 |
|---|------|------|
| 1 | **basePath 빌드** | 각 유틸리티는 `NEXT_PUBLIC_BASE_PATH=/슬러그`로 빌드 → 페이지·에셋·API가 `/슬러그/...` 아래에 생성됨 |
| 2 | **rewrite 프록시** | aible-box `vercel.json`이 `/슬러그` 요청을 유틸리티 Vercel URL로 전달 |
| 3 | **상대 경로 링크** | 카드 `href`는 `/admission/` 같은 **상대 경로** 사용 (외부 절대 URL 비권장) |

### 1-3. API 키는 어디에?

| 프로젝트 | API 키 |
|----------|--------|
| **aible-box** | 넣지 않음 (게이트웨이·카드 허브만 담당) |
| **각 유틸리티** | 해당 도구에서 쓰는 키만 Vercel에 설정 |

---

## 2. 사전 준비 (슬러그·포트·도메인 결정)

새 유틸리티를 추가하기 **전에** 아래 표를 채웁니다.

| 항목 | 규칙 | 예시 (모집요강 추출기) | 예시 (가상 신규 도구) |
|------|------|------------------------|----------------------|
| **슬러그 (slug)** | 소문자·하이픈, 기존과 중복 금지 | `admission` | `report` |
| **사용자 URL** | `https://aible-box.vercel.app/(슬러그)/` | `/admission/` | `/report/` |
| **로컬 dev 포트** | 기존 포트와 겹치지 않게 | `3002` | `3003` |
| **Git 레포명** | 자유 (보통 도구 이름) | `admissions-extractor` | `my-report-tool` |
| **Vercel 프로젝트 URL** | 배포 후 확인 (**반드시 메모**) | `admissions-extractor.vercel.app` | `my-report-tool.vercel.app` |

> **중요:** 슬러그는 한 번 정하면 아래 **5곳에서 동일**해야 합니다.  
> `NEXT_PUBLIC_BASE_PATH` · `vercel.json` rewrite · `utilities.ts` href · `next.config.ts` dev rewrite · `middleware.ts` matcher

---

## 3. 유틸리티 프로젝트 개발 (필수 코드)

아래에서 `(슬러그)`는 실제 슬러그로 바꿉니다. (예: `admission`, `report`, `chat`)

App Router + TypeScript 기준입니다. `src/` 미사용 프로젝트는 경로만 `app/`, `lib/` 루트로 옮기면 됩니다.

---

### 3-1. `next.config.ts` — basePath / assetPrefix

```ts
import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

- `NEXT_PUBLIC_BASE_PATH`가 `/admission`이면 앱 전체가 `/admission` 아래에서 서빙됩니다.
- **끝에 슬래시 없이** `/admission` 형태로 설정합니다.

---

### 3-2. `src/lib/base-path.ts` — API 경로 헬퍼

```ts
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

/** 클라이언트 fetch·라우터 경로에 basePath를 붙입니다. */
export function withBasePath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${basePath}${normalized}`;
}
```

---

### 3-3. 클라이언트 API 호출 — `withBasePath` 필수

`basePath`가 `/admission`일 때 API는 `/admission/api/...`로 서빙됩니다.

```ts
import { withBasePath } from "@/lib/base-path";

// ❌ 잘못된 예 — 404 발생
await fetch("/api/parse/start", { method: "POST", body: form });

// ✅ 올바른 예
await fetch(withBasePath("/api/parse/start"), { method: "POST", body: form });
```

**적용 대상:** 브라우저에서 호출하는 모든 `fetch`, `axios`, WebSocket URL, 다운로드 링크 등.

---

### 3-4. `src/middleware.ts` — 직접 URL 접속 제한 (선택)

aible-box 게이트웨이를 통해서만 접근하게 하려면 Host 검사를 추가합니다.  
**미설정(`ALLOWED_HOSTS` 비어 있음)이면 모든 Host 허용** — 초기 개발·배포 검증 시 편합니다.

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getAllowedHosts(): string[] {
  return (process.env.ALLOWED_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function middleware(request: NextRequest) {
  const allowed = getAllowedHosts();
  if (allowed.length === 0) return NextResponse.next();

  const rawHost =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0]?.toLowerCase() ?? "";

  if (!allowed.includes(host)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
  // (슬러그)를 실제 값으로 교체 — 예: admission
    "/(슬러그)",
    "/(슬러그)/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**`ALLOWED_HOSTS` 설정 시 주의:** Vercel rewrite로 들어오는 요청의 Host는 **`aible-box.vercel.app`** 입니다.  
유틸리티 자체 도메인(`admissions-extractor.vercel.app`)으로 직접 접속도 막으려면:

```bash
ALLOWED_HOSTS=aible-box.vercel.app
```

커스텀 도메인을 쓰면 콤마로 추가합니다.

```bash
ALLOWED_HOSTS=aible-box.vercel.app,box.example.com
```

---

### 3-5. "← AiBle BOX" 복귀 버튼 — `<a>` 사용

Next.js `Link`는 `basePath` **안쪽**으로만 이동합니다. 플랫폼 홈으로 나가려면 일반 앵커 + 절대(또는 루트) URL을 씁니다.

```tsx
const aibleBoxUrl = process.env.NEXT_PUBLIC_AIBLE_BOX_URL ?? "/";

// ❌ Link — /admission/ 안에서만 이동
// <Link href="/">← AiBle BOX</Link>

// ✅ a 태그 — 플랫폼 루트로 이동
<a href={aibleBoxUrl}>← AiBle BOX</a>
```

---

### 3-6. `package.json` — 로컬 포트 분리

```json
{
  "scripts": {
    "dev": "next dev -p 3003",
    "build": "next build",
    "start": "next start -p 3003"
  }
}
```

| 프로젝트 | 권장 포트 |
|----------|-----------|
| aible-box | 3000 |
| excel-ai-chat (AiBle CHAT) | 3001 |
| admissions-extractor | 3002 |
| (다음 신규 도구) | 3003, 3004, … |

---

### 3-7. `.env.example` (유틸리티 레포)

```bash
# 필수 — 슬러그와 동일 (앞에 /, 끝 슬래시 없음)
NEXT_PUBLIC_BASE_PATH=/report

# 필수 — AiBle BOX 플랫폼 URL
# 로컬: http://localhost:3000
# 프로덕션: https://aible-box.vercel.app/
NEXT_PUBLIC_AIBLE_BOX_URL=http://localhost:3000

# 선택 — 게이트웨이 통해서만 접근 허용 (안정화 후 설정)
# ALLOWED_HOSTS=aible-box.vercel.app

# 도구 전용 API 키 (도구마다 다름, 아래 예시)
# GEMINI_API_KEY=
# LLAMA_CLOUD_API_KEY=
# OPENAI_API_KEY=
```

---

## 4. 유틸리티 Vercel 배포 & 환경 변수

### 4-1. 배포 절차

1. GitHub에 유틸리티 레포 푸시
2. [Vercel Dashboard](https://vercel.com) → **Add New → Project** → 레포 Import
3. **Environment Variables** 입력 (아래 표)
4. **Deploy**
5. 배포 완료 후 **실제 Vercel URL 확인** (예: `https://admissions-extractor.vercel.app`)
6. **단독 접속 테스트:** `https://(실제-vercel-url)/(슬러그)/`  
   - 예: `https://admissions-extractor.vercel.app/admission`

> 6번이 성공해야 aible-box 연동이 가능합니다. 이 단계를 건너뛰면 게이트웨이에서 404가 납니다.

---

### 4-2. 유틸리티 Vercel 환경 변수 (전체)

| 변수 | 예시 값 | 필수 | 설명 |
|------|---------|------|------|
| `NEXT_PUBLIC_BASE_PATH` | `/admission` | **필수** | 슬러그와 동일. 빌드 시 경로 prefix |
| `NEXT_PUBLIC_AIBLE_BOX_URL` | `https://aible-box.vercel.app/` | **필수** | 복귀 버튼·문서 링크용 |
| `ALLOWED_HOSTS` | `aible-box.vercel.app` | 선택 | middleware Host 제한 |
| (도구 API 키) | 도구별 | 도구별 | 아래 참고 |

**도구별 API 키 예시 (해당 도구에서 실제 사용하는 것만 설정):**

| 유틸리티 | 자주 쓰는 키 |
|----------|-------------|
| AiBle CHAT (`excel-ai-chat`) | `OPENAI_API_KEY`, 기타 LLM/DB 키 |
| 모집요강 추출기 (`admissions-extractor`) | `GEMINI_API_KEY`, `LLAMA_CLOUD_API_KEY` 등 |
| (신규 도구) | 해당 도구 `.env.example` 참고 |

- Environment: **Production**, **Preview**, **Development** 모두 동일하게 넣는 것을 권장합니다.
- 변수 추가·변경 후 **Redeploy** 필수 (`NEXT_PUBLIC_*`는 빌드 시 번들에 포함됨).

---

## 5. aible-box 플랫폼 연동

유틸리티 단독 배포가 확인된 **후** aible-box 레포를 수정합니다.

수정 위치는 **4곳**입니다.

---

### 5-1. 카드 등록 — `src/data/utilities.ts`

`utilities` 배열에 항목을 추가합니다.

```ts
{
  id: "my-report-tool",           // 고유 ID (영문, 하이픈)
  name: "리포트 생성기",            // 카드 제목
  description: "한 줄 설명",
  features: [
    "기능 1",
    "기능 2",
  ],
  href: process.env.NEXT_PUBLIC_REPORT_URL ?? "/report/",  // 상대 경로!
  tags: ["태그1", "태그2"],
  category: "데이터 분석",
  developer: "홍길동",
},
```

**`href` 규칙:**

| 방식 | 값 | 권장 |
|------|-----|------|
| 상대 경로 | `/report/` | ✅ 권장 |
| env 오버라이드 | `process.env.NEXT_PUBLIC_REPORT_URL ?? "/report/"` | ✅ 권장 |
| 외부 절대 URL | `https://other.vercel.app/` | ❌ 비권장 |

카드는 `<a href={utility.href}>`로 **같은 탭**에서 이동합니다 (`UtilityCard.tsx`).

---

### 5-2. 프로덕션 rewrite — `vercel.json`

**슬러그마다 rewrite 2줄**을 추가합니다.

```json
{
  "rewrites": [
    {
      "source": "/report",
      "destination": "https://my-report-tool.vercel.app/report"
    },
    {
      "source": "/report/:path*",
      "destination": "https://my-report-tool.vercel.app/report/:path*"
    }
  ]
}
```

**현재 운영 중인 실제 설정 예시:**

```json
{
  "rewrites": [
    {
      "source": "/chat",
      "destination": "https://seesign-chat.vercel.app/chat"
    },
    {
      "source": "/chat/:path*",
      "destination": "https://seesign-chat.vercel.app/chat/:path*"
    },
    {
      "source": "/admission",
      "destination": "https://admissions-extractor.vercel.app/admission"
    },
    {
      "source": "/admission/:path*",
      "destination": "https://admissions-extractor.vercel.app/admission/:path*"
    }
  ]
}
```

> **`destination`은 반드시 실제 Vercel 배포 URL이어야 합니다.**  
> 레포 이름과 Vercel URL이 다를 수 있습니다. (예: 레포 `admissions-extractor` ≠ 잘못된 URL `admission-parser.vercel.app`)

---

### 5-3. 로컬 개발 rewrite — `next.config.ts`

프로덕션 rewrite는 `vercel.json`이 담당합니다.  
**로컬**에서만 `next.config.ts`의 `rewrites()`가 동작합니다 (`NODE_ENV === "development"`).

```ts
async rewrites() {
  if (isGithubPages || process.env.NODE_ENV !== "development") {
    return [];
  }

  const chatOrigin = process.env.EXCEL_AI_CHAT_DEV_URL ?? "http://localhost:3001";
  const admissionOrigin = process.env.ADMISSION_DEV_URL ?? "http://localhost:3002";
  const reportOrigin = process.env.REPORT_DEV_URL ?? "http://localhost:3003";

  return [
    { source: "/chat", destination: `${chatOrigin}/chat` },
    { source: "/chat/:path*", destination: `${chatOrigin}/chat/:path*` },
    { source: "/admission", destination: `${admissionOrigin}/admission` },
    { source: "/admission/:path*", destination: `${admissionOrigin}/admission/:path*` },
    // 신규 도구 추가 예시:
    { source: "/report", destination: `${reportOrigin}/report` },
    { source: "/report/:path*", destination: `${reportOrigin}/report/:path*` },
  ];
},
```

---

### 5-4. `.env.example` / `.env.local.example` 문서화

**`.env.example`** (카드 링크 — Vercel에도 설정 가능):

```bash
NEXT_PUBLIC_EXCEL_AI_CHAT_URL=/chat/
NEXT_PUBLIC_ADMISSION_URL=/admission/
NEXT_PUBLIC_REPORT_URL=/report/
```

**`.env.local.example`** (로컬 rewrite용 — Vercel에 넣지 않음):

```bash
EXCEL_AI_CHAT_DEV_URL=http://localhost:3001
ADMISSION_DEV_URL=http://localhost:3002
REPORT_DEV_URL=http://localhost:3003
```

---

## 6. aible-box Vercel 환경 변수

aible-box는 **게이트웨이**이므로 API 키가 필요 없습니다.

### 6-1. Vercel (Production / Preview / Development)

| 변수 | 값 | 필수 | 설명 |
|------|-----|------|------|
| `NEXT_PUBLIC_EXCEL_AI_CHAT_URL` | `/chat/` | 권장 | AiBle CHAT 카드 링크 |
| `NEXT_PUBLIC_ADMISSION_URL` | `/admission/` | 권장 | 모집요강 추출기 카드 링크 |
| `NEXT_PUBLIC_REPORT_URL` | `/report/` | 신규 도구 추가 시 | 해당 도구 카드 링크 |

- 미설정 시 `utilities.ts`의 `?? "/슬러그/"` 기본값이 사용됩니다.
- **rewrite 대상 URL은 `vercel.json`에서 관리**합니다. env가 아닙니다.

### 6-2. 로컬만 (` .env.local ` — Git에 커밋하지 않음)

| 변수 | 값 |
|------|-----|
| `EXCEL_AI_CHAT_DEV_URL` | `http://localhost:3001` |
| `ADMISSION_DEV_URL` | `http://localhost:3002` |
| `(도구명)_DEV_URL` | `http://localhost:300X` |

### 6-3. GitHub Pages 전용 (Vercel과 별개)

| 변수 | 값 | 설명 |
|------|-----|------|
| `GITHUB_PAGES` | `true` | GitHub Actions 빌드 시에만 설정 |

> GitHub Pages(`https://ddailable.github.io/AibleBox/`)는 **정적 사이트**입니다.  
> `vercel.json` rewrite는 동작하지 않아 **유틸리티 프록시(`/chat/`, `/admission/`)는 Vercel에서만** 사용할 수 있습니다.

---

## 7. 배포 순서 & 검증 체크리스트

### 7-1. 권장 배포 순서

```
[1] 유틸리티 레포 개발 (basePath, withBasePath, middleware, 복귀 버튼)
      ↓
[2] 유틸리티 Vercel 배포 + 환경 변수 설정
      ↓
[3] https://(유틸-vercel-url)/(슬러그)/ 단독 접속 테스트 ✅
      ↓
[4] aible-box 수정 (utilities.ts, vercel.json, next.config.ts, .env.example)
      ↓
[5] aible-box Git push → Vercel Redeploy
      ↓
[6] https://aible-box.vercel.app/(슬러그)/ 통합 테스트 ✅
```

### 7-2. 유틸리티 프로젝트 체크리스트

- [ ] `NEXT_PUBLIC_BASE_PATH=/슬러그` 설정
- [ ] `next.config.ts` — `basePath`, `assetPrefix`
- [ ] `lib/base-path.ts` — `withBasePath`
- [ ] 모든 클라이언트 `fetch`에 `withBasePath` 적용
- [ ] `middleware.ts` — matcher 슬러그 일치 (선택: `ALLOWED_HOSTS`)
- [ ] "← AiBle BOX" — `<a href={NEXT_PUBLIC_AIBLE_BOX_URL}>`
- [ ] `package.json` — dev 포트 분리 (`-p 300X`)
- [ ] `.env.example` 작성
- [ ] Vercel 배포 + 환경 변수
- [ ] **단독 URL 테스트 통과**

### 7-3. aible-box 체크리스트

- [ ] `src/data/utilities.ts` — 카드 추가 (`href` 상대 경로)
- [ ] `vercel.json` — rewrite 2줄 (**실제 Vercel URL**)
- [ ] `next.config.ts` — dev rewrite 2줄
- [ ] `.env.example` — `NEXT_PUBLIC_*_URL` 문서화
- [ ] Git push → **Redeploy**
- [ ] 플랫폼 홈에서 카드 표시 확인
- [ ] 카드 클릭 → 게이트웨이 경로 진입 확인
- [ ] 유틸 내부 기능 (업로드, API, 다운로드) 확인
- [ ] "← AiBle BOX" 클릭 → 홈 복귀 확인

---

## 8. 로컬 통합 개발

세 터미널에서 동시에 실행합니다.

```bash
# 터미널 A — 플랫폼
cd aible-box
npm run dev                    # http://localhost:3000

# 터미널 B — AiBle CHAT
cd excel-ai-chat
npm run dev                    # http://localhost:3001  (NEXT_PUBLIC_BASE_PATH=/chat)

# 터미널 C — 모집요강 추출기
cd admissions-extractor
npm run dev                    # http://localhost:3002  (NEXT_PUBLIC_BASE_PATH=/admission)
```

**접속 URL:**

| 목적 | URL |
|------|-----|
| 플랫폼 홈 | http://localhost:3000 |
| CHAT (게이트웨이 경유) | http://localhost:3000/chat |
| CHAT (단독) | http://localhost:3001/chat |
| Admission (게이트웨이 경유) | http://localhost:3000/admission |
| Admission (단독) | http://localhost:3002/admission |

aible-box `.env.local` 예시:

```bash
EXCEL_AI_CHAT_DEV_URL=http://localhost:3001
ADMISSION_DEV_URL=http://localhost:3002
```

---

## 9. 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| `DEPLOYMENT_NOT_FOUND` (Vercel) | `vercel.json`의 `destination` URL이 **존재하지 않는 배포**를 가리킴 | Vercel 대시보드에서 유틸리티 **실제 URL** 확인 후 `vercel.json` 수정 → aible-box Redeploy |
| `/슬러그` 404 | 유틸리티에 `NEXT_PUBLIC_BASE_PATH` 미설정 | 유틸리티 Vercel env 설정 후 **Redeploy** |
| CSS/JS 깨짐, `_next` 404 | `basePath`·`assetPrefix`·rewrite·destination 슬러그 불일치 | 네 곳 모두 동일 슬러그인지 확인 |
| API 호출 404 | `fetch("/api/...")` 절대 경로 사용 | `withBasePath("/api/...")` 로 변경 |
| 게이트웨이 rewrite 안 됨 | `vercel.json` 수정 후 aible-box **Redeploy 안 함** | push 후 Vercel Redeploy |
| "← AiBle BOX"가 `/슬러그/` 안에서만 이동 | `Link` 사용 | `<a href={NEXT_PUBLIC_AIBLE_BOX_URL}>` 로 변경 |
| 직접 `xxx.vercel.app` 접속 403 | `ALLOWED_HOSTS`에 게이트웨이 Host 없음 | `ALLOWED_HOSTS=aible-box.vercel.app` 확인 |
| env 바꿨는데 반영 안 됨 | `NEXT_PUBLIC_*`는 빌드 타임 변수 | **Redeploy** (재빌드) 필요 |
| GitHub Pages에서 유틸 404 | Pages는 rewrite 미지원 | 유틸리티는 **Vercel 게이트웨이**로만 접근 안내 |

### 9-1. `DEPLOYMENT_NOT_FOUND` 상세 (실제 사례)

**증상:** `https://aible-box.vercel.app/admission` 접속 시 Vercel `DEPLOYMENT_NOT_FOUND`

**원인:** `vercel.json`이 `admission-parser.vercel.app`을 가리켰으나, 실제 배포는 `admissions-extractor.vercel.app`이었음.

**해결:**

```json
"destination": "https://admissions-extractor.vercel.app/admission"
```

→ aible-box push & Redeploy 후 정상 동작.

---

## 10. 현재 운영 중인 유틸리티 참고표

| 카드 이름 | 슬러그 | aible-box 경로 | 유틸 Vercel URL | `NEXT_PUBLIC_BASE_PATH` |
|-----------|--------|----------------|-----------------|-------------------------|
| AiBle CHAT | `chat` | `/chat/` | `seesign-chat.vercel.app` | `/chat` |
| 모집요강 학과 추출기 | `admission` | `/admission/` | `admissions-extractor.vercel.app` | `/admission` |

**aible-box 카드 env:**

```bash
NEXT_PUBLIC_EXCEL_AI_CHAT_URL=/chat/
NEXT_PUBLIC_ADMISSION_URL=/admission/
```

---

## 11. 부록: GitHub Pages (정적 미러)

aible-box는 GitHub Actions로 **정적 미러**도 배포합니다.

| 항목 | 값 |
|------|-----|
| URL | `https://ddailable.github.io/AibleBox/` |
| 워크플로 | `.github/workflows/deploy.yml` |
| 빌드 변수 | `GITHUB_PAGES=true` |

GitHub Pages에서는:

- 플랫폼 홈·카드 UI는 동작
- `vercel.json` rewrite는 **동작하지 않음** → `/chat/`, `/admission/` 프록시 불가
- **실제 유틸리티 사용은 Vercel** (`https://aible-box.vercel.app`)을 안내

GitHub Pages 설정: 레포 **Settings → Pages → Source: GitHub Actions**

---

## 한 줄 요약

> **유틸리티:** `NEXT_PUBLIC_BASE_PATH` + `withBasePath` + (선택) middleware + BOX 복귀 `<a>` → Vercel 별도 배포 → **단독 URL 테스트**  
> **aible-box:** 카드 추가 + `vercel.json` rewrite(**실제 Vercel URL**) + dev rewrite → Redeploy  
> **링크는 항상** `/(슬러그)/` 상대 경로 · **API 키는 유틸리티에만**

---

## 관련 문서

- `docs/UTILITY_ONBOARDING.md` — 짧은 온보딩 요약
- `docs/배포_프로세스_매뉴얼.md` — SOP 체크리스트 (일부 URL은 본 문서 기준으로 갱신 필요)

**최종 갱신:** 2026-06-24 · 운영 URL 기준 (`admissions-extractor.vercel.app`)
