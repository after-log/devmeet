# devmeet

검증된 개발자와, 개발자를 만나고 싶은 사람을 연결하는 소개팅 앱 프로토타입.
Vite + React + TypeScript + Tailwind CSS 프론트엔드와 Spring Boot + MySQL API로 구성합니다.

## 로컬 실행

```bash
npm ci
npm run dev
```

개발 서버: http://localhost:5173

```bash
npm run format     # Prettier 포맷 및 Tailwind 클래스 정렬
npm run format:check # 포맷 검사
npm run typecheck  # TypeScript strict 검사
npm run build      # 타입 검사 후 dist/에 프로덕션 빌드
npm run preview    # http://localhost:4173 에서 빌드 결과 확인
```

현재 로컬 Node.js 20.12에서도 실행할 수 있도록 Vite 6을 사용합니다.
CI와 Docker 빌드는 Node.js 22를 사용합니다.

## 화면 흐름

화면 흐름은 [devmeet-mvp](https://devmeet-mvp.devmeet-mvp.workers.dev/)를 따르고, 디자인은 기존 다크 IDE 테마·코드 카드·Galmuri/JetBrains Mono를 유지합니다.

```
시작 → 이메일 가입·로그인 → 프로필 4단계(역할 → 기본 정보 → 만남의 리듬 → 사진·소개) → 오늘의 추천
오늘의 추천 → 프로필 상세 → 좋아요(LGTM!) → 상호 매칭 → 첫 대화
하단 탭: 추천 / 좋아요 / 대화 / 내 정보
```

- 추천은 하루 세 명이고, 한국 시간 자정까지 같은 세 명이 유지돼요. 좋아요도 하루 세 번이에요.
- 추천 이유는 퍼센트 대신 만남·연락 빈도가 같은 점으로 설명해요.
- 서로 좋아요를 보낸 상대와만 대화할 수 있어요. 첫 인사 제안을 누르면 입력창에 채워지고, 자동 답장은 없어요.
- 프로필 사진은 필수이고 마지막 단계 맨 위에 있어요. 사는 지역은 시·도와 구·시를 따로 골라요.
- 대화·프로필 메뉴에서 신고와 차단을, 내 정보에서 추천 조건(지역·나이)과 차단 해제를 할 수 있어요.
- 시작 화면의 '가입 없이 화면 둘러보기'는 가상 인물 세 명으로 흐름만 보여 줘요.

## 실제 API 연결

먼저 [BE 실행 문서](../backend/README.md)에 따라 서버를 실행합니다.
FE는 기본적으로 `/api/*`를 호출하며 Vite가 `127.0.0.1:8080`으로 프록시합니다.
`/oauth2/*`, `/login/oauth2/*`도 같은 서버로 전달합니다.

- 계정·프로필·좋아요·매칭·대화·신고·차단은 원격 MySQL에 저장합니다.
- 사진은 서버에 업로드하며 운영자 승인 후 추천 대상에 포함됩니다.
- 가치관은 기본 비공개이며 공개 답변은 최대 10개입니다.
- 새 메시지·매칭은 SSE로 갱신하고, 연결 복구를 위해 30초 간격으로도 동기화합니다.
- 과거 대화는 커서 기반으로 100개씩 불러옵니다.
- 로그인은 HttpOnly 세션 쿠키를 사용하고 변경 요청에는 CSRF 토큰을 보냅니다.
- 카카오·GitHub, 이메일 인증·비밀번호 재설정은 BE의 OAuth/SMTP 설정이 필요합니다.
- **가입 없이 둘러보기**만 가상 인물과 메모리 상태를 사용하며 실제 요청을 전송하지 않습니다.
- 기존 localStorage 목업 계정은 자동 이전하지 않습니다. 서버에 새로 가입해야 합니다.

## 라우트

| URL                             | 화면                                              |
| ------------------------------- | ------------------------------------------------- |
| `/`                             | 시작. 로그인 상태면 추천이나 프로필 작성으로 이동 |
| `/auth/register`, `/auth/login` | 이메일 가입·로그인                                |
| `/onboarding`                   | 프로필 4단계 작성·편집                            |
| `/today`                        | 오늘의 추천                                       |
| `/people/:id`                   | 프로필 상세                                       |
| `/match/:id`                    | 상호 매칭                                         |
| `/likes`                        | 보낸·받은 좋아요                                  |
| `/chat`, `/chat/:id`            | 대화 목록·대화                                    |
| `/me`                           | 내 정보                                           |
| `/me/values`                    | 가치관 선택·편집 (5개 섹션, 80문항)               |
| `/admin`                        | 운영자 검수·신고·풀·통계 (관리자 전용)            |

예전 주소 `/discover`, `/signup`은 새 화면으로 이동합니다. 알 수 없는 URL은 404 화면을 표시합니다.

## 구조

| 경로                            | 설명                                               |
| ------------------------------- | -------------------------------------------------- |
| `src/App.tsx`                   | 라우트와 회원 전용 화면 보호                       |
| `src/pages/`                    | 라우트별 화면                                      |
| `src/components/PersonCard.tsx` | 사진을 넣은 코드 카드, 목록 행, 빈 화면            |
| `src/components/AppSheets.tsx`  | 추천 조건·안전·신고·차단·안내 시트                 |
| `src/stores/app.ts`             | 로그인·추천·좋아요·가입 초안·둘러보기 상태         |
| `src/lib/api.ts`                | 서버 HTTP API 클라이언트                           |
| `src/data/`                     | 선택지(지역·학력·음주 등)와 가상 회원              |
| `src/types/`                    | 프로필·회원·메시지 타입                            |
| `src/style.css`                 | 다크·라이트 팔레트와 Galmuri/JetBrains Mono 디자인 |
| `data/value-questions.json`     | 가치관 문항 뱅크 80개 (현재 화면에서는 쓰지 않음)  |
| `src/data/value-questions.json` | 노션 기준 5개 섹션의 단일 선택 문항 80개           |

내 정보의 **나의 가치관**에서 섹션별로 답변하고 저장할 수 있습니다. 문항마다 건너뛰기와
공개 설정을 지원하며, 새 답변은 기본 비공개입니다. 프로필에는 최대 10개까지 직접 골라
공개할 수 있고 내 정보에서 공개할 답변을 미리 확인할 수 있습니다.
답변은 프로필과 함께 이 브라우저에 저장됩니다. 둘러보기에서는
체험을 종료하거나 새로고침하기 전까지만 저장됩니다. 기존 `data/value-questions.json`의
O/X 문항은 사용하지 않습니다.

## 스타일과 포맷

Tailwind CSS 4의 Vite 플러그인을 사용합니다. 색상과 글꼴은 `src/style.css`의
`@theme`에 정의하며, 레이아웃은 JSX 유틸리티 클래스, 반복되는 버튼과 카드 등은
`@layer components`의 `@apply`로 관리합니다.

Prettier 설정은 `.prettierrc.json`에 있습니다. Tailwind 플러그인이 클래스 순서를
정렬합니다. VS Code에서 권장 확장(Prettier, Tailwind CSS IntelliSense)을 설치하면
저장 시 자동 포맷이 적용됩니다.

## 배포

저장소 루트의 Dockerfile은 `npm ci`와 `npm run build`를 실행한 다음
생성된 `dist/`를 nginx 이미지에 복사합니다. 사전 로컬 빌드는 필요 없습니다.
GitHub Actions는 TypeScript 검사·Vite 빌드와 컨테이너 빌드를 검증하고,
기존 k3s 배포 흐름을 실행합니다.
