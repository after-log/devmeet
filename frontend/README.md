# devmeet

검증된 개발자와, 개발자를 만나고 싶은 사람을 연결하는 소개팅 앱 프로토타입.
Vite + React + TypeScript + Tailwind CSS로 구성한 모바일 정적 목업입니다.

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

## 서버 연동 전 목업 API

백엔드는 아직 연결하지 않았습니다. `src/lib/mock-api.ts`가 devmeet-mvp 서버(`/api/*`)와 같은 이름과 규칙으로 동작하고, 데이터는 이 브라우저의 localStorage(`devmeet.mock.v1`)에만 저장합니다.

| 함수                          | 대응하는 서버 API              | 하는 일                                        |
| ----------------------------- | ------------------------------ | ---------------------------------------------- |
| `me`                          | `GET /api/me`                  | 로그인 상태 확인                               |
| `register`, `login`, `logout` | `POST /api/register` 등        | 이메일·비밀번호 계정. 비밀번호는 해시로만 저장 |
| `saveProfile`                 | `PUT /api/profile`             | 프로필·추천 조건 저장과 필수값 검사            |
| `photo`                       | `POST /api/photo`              | 사진을 640px JPEG로 줄여 data URL로 저장       |
| `recommendations`             | `GET /api/recommendations`     | 하루 세 명 배정과 남은 좋아요                  |
| `like`                        | `POST /api/likes`              | 좋아요, 하루 3회 제한, 매칭 여부               |
| `connections`                 | `GET /api/connections`         | 보낸·받은 좋아요와 매칭 목록                   |
| `messages`, `send`            | `/api/messages/:id`            | 매칭 상대와의 대화                             |
| `report`, `block`, `blocks`   | `/api/report`, `/api/block(s)` | 신고 기록, 차단·해제                           |

추천 대상은 `src/data/members.ts`의 가상 회원 24명(여 12, 남 12)입니다. 이 중 일부는 이미 나에게 좋아요를 보낸 것으로 되어 있어, 좋아요를 보내면 바로 매칭돼요. 사진은 Unsplash 자리표시용입니다. 서버를 붙일 때는 `mock-api.ts`를 같은 함수 이름의 fetch 구현으로 바꾸면 화면 코드는 그대로 쓸 수 있습니다.

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
| `/admin`                        | 운영자 검수·풀·퍼널 데모                          |

예전 주소 `/discover`, `/signup`은 새 화면으로 이동합니다. 알 수 없는 URL은 404 화면을 표시합니다.

## 구조

| 경로                            | 설명                                               |
| ------------------------------- | -------------------------------------------------- |
| `src/App.tsx`                   | 라우트와 회원 전용 화면 보호                       |
| `src/pages/`                    | 라우트별 화면                                      |
| `src/components/PersonCard.tsx` | 사진을 넣은 코드 카드, 목록 행, 빈 화면            |
| `src/components/AppSheets.tsx`  | 추천 조건·안전·신고·차단·안내 시트                 |
| `src/stores/app.ts`             | 로그인·추천·좋아요·가입 초안·둘러보기 상태         |
| `src/lib/mock-api.ts`           | 서버 연동 전 목업 API                              |
| `src/data/`                     | 선택지(지역·학력·음주 등)와 가상 회원              |
| `src/types/`                    | 프로필·회원·메시지 타입                            |
| `src/style.css`                 | 다크·라이트 팔레트와 Galmuri/JetBrains Mono 디자인 |
| `data/value-questions.json`     | 가치관 문항 뱅크 80개 (현재 화면에서는 쓰지 않음)  |

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
