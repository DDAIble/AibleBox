# AiBle BOX 유틸리티 등록 가이드

새 도구(유틸리티)를 AiBle BOX 플랫폼에 올릴 때 **aible-box**와 **각 도구 프로젝트**에서 무엇을 수정하는지 정리한 문서입니다.

---

## 1. 현재 구조 (게이트웨이 패턴)

직원에게는 **aible-box 도메인 하나**만 공개합니다. 각 도구는 별도 Vercel 프로젝트로 배포되지만, URL은 하위 경로로 묶입니다.

```
https://aible-box.vercel.app/           → aible-box (플랫폼 홈)
https://aible-box.vercel.app/chat/      → excel-ai-chat (Vercel rewrite)
https://aible-box.vercel.app/(새경로)/  → 새 도구 (Vercel rewrite 추가)
```

| 프로젝트 | Vercel 배포 | 사용자에게 보이는 경로 |
|----------|-------------|------------------------|
| aible-box | `aible-box.vercel.app` | `/` |
| excel-ai-chat | `seesign-chat.vercel.app` | `/chat` |
| (새 도구) | `(도구).vercel.app` | `/원하는-경로` |

**핵심:** 카드 링크는 **절대 URL(`seesign-chat.vercel.app`)이 아니라** aible-box 기준 **상대 경로**(`/chat/`)를 씁니다.

---

## 2. 경로 이름 정하기

새 도구를 추가하기 전에 **고정 경로(slug)** 를 정합니다.

| 예시 slug | 사용자 URL | 비고 |
|-----------|------------|------|
| `chat` | `/chat/` | excel-ai-chat (기존) |
| `report` | `/report/` | 가칭: 리포트 도구 |
| `ocr` | `/ocr/` | 가칭: OCR 도구 |

규칙 권장:

- 소문자, 하이픈 사용 (`my-tool`)
- 끝에 `/` 포함해 등록 (`/report/`)
- 다른 도구와 겹치지 않게 `vercel.json` rewrite와 동일하게 유지

---

## 3. 작업 체크리스트 (요약)

### A. 새 도구 프로젝트 (예: `my-new-tool`)

- [ ] Vercel에 **별도 프로젝트**로 배포
- [ ] `NEXT_PUBLIC_BASE_PATH=/원하는-경로` 설정 후 빌드·배포
- [ ] API `fetch` 경로에 `withBasePath()` 적용
- [ ] 플랫폼 복귀 버튼: `<a href={...}>` + `NEXT_PUBLIC_AIBLE_BOX_URL`
- [ ] (선택) `ALLOWED_HOSTS` — 커스텀 도메인 연결 후 직접 URL 차단
- [ ] `https://(도구-vercel-url)/원하는-경로` 단독 접속 테스트

### B. aible-box (플랫폼)

- [ ] `src/data/utilities.ts`에 카드 항목 추가
- [ ] `vercel.json`에 rewrite 2줄 추가
- [ ] `next.config.ts` 로컬 dev rewrite 추가 (선택)
- [ ] `.env.example`에 링크용 env 문서화 (선택)
- [ ] Git push → Vercel 재배포
- [ ] `https://aible-box.vercel.app/(새경로)/` 접속 테스트

---

## 4. aible-box에서 수정하는 방법

### 4-1. 카드 등록 — `src/data/utilities.ts`

`utilities` 배열에 객체를 추가합니다.

```ts
{
  id: "my-new-tool",
  name: "도구 이름",
  description: "한 줄 설명",
  features: ["기능 1", "기능 2"],
  href: process.env.NEXT_PUBLIC_MY_NEW_TOOL_URL ?? "/report/",
  tags: ["태그1", "태그2"],
  category: "카테고리명",
  developer: "개발자 이름",
},
```

**`href` 규칙**

| 방식 | 값 | 언제 쓰나 |
|------|-----|-----------|
| **권장** | `/report/` | aible-box 게이트웨이 하위 경로 |
| env 오버라이드 | `process.env.NEXT_PUBLIC_XXX_URL ?? "/report/"` | 로컬·스테이징 URL이 다를 때 |
| 비권장 | `https://other.vercel.app/` | 직접 URL 노출, 인증 우회 위험 |

### 4-2. 프로덕션 프록시 — `vercel.json`

새 도구마다 **rewrite 2개**를 추가합니다.

```json
{
  "source": "/report",
  "destination": "https://my-new-tool.vercel.app/report"
},
{
  "source": "/report/:path*",
  "destination": "https://my-new-tool.vercel.app/report/:path*"
}
```

변경 후 **Git push → aible-box Vercel 재배포** 필수.

### 4-3. 로컬 개발 — `next.config.ts`

```ts
const reportOrigin = process.env.MY_NEW_TOOL_DEV_URL ?? "http://localhost:3002";
{ source: "/report", destination: `${reportOrigin}/report` },
{ source: "/report/:path*", destination: `${reportOrigin}/report/:path*` },
```

### 4-4. aible-box 환경변수 (Vercel)

| 변수 | 예시 값 |
|------|---------|
| `NEXT_PUBLIC_EXCEL_AI_CHAT_URL` | `/chat/` |
| `NEXT_PUBLIC_MY_NEW_TOOL_URL` | `/report/` |

API 키는 **각 도구 프로젝트**에만 설정합니다.

---

## 5. 새 도구 프로젝트에서 수정하는 방법

excel-ai-chat과 동일한 패턴을 따릅니다. 참고: `excel-ai-chat` 레포의 `src/lib/base-path.ts`, `next.config.ts`, `src/middleware.ts`.

### 5-1. Vercel 환경변수

| 변수 | 예시 | 필수 |
|------|------|------|
| `NEXT_PUBLIC_BASE_PATH` | `/report` | ✅ |
| `NEXT_PUBLIC_AIBLE_BOX_URL` | `https://aible-box.vercel.app/` | ✅ |
| (도구 전용 API 키) | `GEMINI_API_KEY` 등 | 도구마다 다름 |
| `ALLOWED_HOSTS` | `aible-box.vercel.app` | 나중에 |

### 5-2. 플랫폼 복귀 버튼

`Next.js Link` 대신 `<a href={process.env.NEXT_PUBLIC_AIBLE_BOX_URL ?? "/"}>` 사용.

---

## 6. Vercel 배포 순서

1. 새 도구 배포 → `(도구-url)/report` 확인
2. aible-box 수정 (`utilities.ts`, `vercel.json`) → push → Redeploy
3. `aible-box.vercel.app/report/` 통합 확인
4. (선택) `ALLOWED_HOSTS` 설정

---

## 7. excel-ai-chat 참고 (기존)

| 항목 | 값 |
|------|-----|
| slug | `chat` |
| 카드 href | `/chat/` |
| `NEXT_PUBLIC_BASE_PATH` | `/chat` |
| Vercel URL | `https://seesign-chat.vercel.app` |

---

## 8. 자주 하는 실수

| 증상 | 해결 |
|------|------|
| `/report` 404 | 도구에 `NEXT_PUBLIC_BASE_PATH` 설정 후 Redeploy |
| CSS/JS 깨짐 | basePath·rewrite·destination 경로 통일 |
| BOX 버튼이 안쪽에서만 이동 | `Link` → `<a>` + `NEXT_PUBLIC_AIBLE_BOX_URL` |
| rewrite 안 됨 | `vercel.json` push 후 aible-box Redeploy |

---

## 9. 나중에 로그인 붙일 때

- 쿠키 도메인을 aible-box와 동일하게
- **각 도구 API**에도 서버 인증 검증
- `ALLOWED_HOSTS`는 보조 수단

---

## 10. 한 줄 요약

> **aible-box:** 카드 추가 + `vercel.json` rewrite  
> **새 도구:** `NEXT_PUBLIC_BASE_PATH` + `withBasePath` + BOX 복귀 `<a>` + Vercel 별도 배포  
> **링크는 항상** `aible-box.vercel.app/(경로)/` 기준 상대 경로
