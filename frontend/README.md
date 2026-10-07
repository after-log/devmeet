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

- 첫 방문: 가입 시작 → 역할 → 짧은 기본 프로필 단계 → 모의 인증 → 상대 선택 → 만남·연락 빈도 → 프로필 완성
- 재방문: 발견 화면으로 진입. 가입 프로필은 localStorage에 보관합니다.
- 발견 → 호감 → 민준과 상호 호감 목업 → 대화
- 마이 화면에서 인증·가치관·선호 설정을 다시 체험할 수 있습니다.
- 기존 다크 테마와 최대 480px 모바일 레이아웃을 유지합니다.
- 하루 3명 데모, GitHub 필수·회사 이메일 선택, 만남·연락 빈도 입력을 제공합니다.
- 기본 프로필은 화면당 2–3개 항목으로 나누며 O/X·직장·학교·키워드는 가입 후 선택 입력입니다. 지역·나이·거리·접속 필터는 UI 체험입니다. 실제 인증·일별 추천 배치는 미연동입니다.
- MVP 기획 문서는 [MVP v0.1](../docs/MVP-v0.1.md)에 정리했습니다.
- 헤더의 `⌘` 버튼으로 가입 흐름을 처음부터 시작할 수 있습니다.

인증, 추천 프로필, 신고, 메시지 전송은 백엔드에 연결되지 않은 목업입니다.
호감·매칭·대화는 sessionStorage에 보관하므로 같은 탭에서 새로고침해도 유지됩니다.

## 라우트

React Router의 BrowserRouter를 사용합니다.

| URL                | 화면                                   |
| ------------------ | -------------------------------------- |
| `/`                | 첫 방문은 가입, 재방문은 발견으로 이동 |
| `/signup`          | 가입                                   |
| `/discover`        | 발견                                   |
| `/likes`           | 보낸 호감                              |
| `/chat`            | 대화 목록                              |
| `/chat/:profileId` | 대화 상세 (현재 목업은 `MJ`)           |
| `/me`              | 나의 프로필                            |
| `/admin`           | 운영자 검수·풀·퍼널 데모               |

알 수 없는 URL은 404 화면을 표시합니다. 매칭되지 않은 대화 주소는 목록으로 이동합니다.
기존 nginx의 `try_files` 설정으로 배포 환경에서도 URL 직접 접근과 새로고침을 지원합니다.

## 구조

| 경로                             | 설명                                             |
| -------------------------------- | ------------------------------------------------ |
| `index.html`                     | Vite HTML 진입점                                 |
| `src/main.tsx`                   | React 진입점                                     |
| `src/App.tsx`                    | 페이지 전환 및 앱 상태                           |
| `src/components/`                | 가입·발견·대화·모달·프로필 코드 카드             |
| `src/pages/`                     | 라우트별 페이지                                  |
| `src/stores/devmeet.ts`          | 라우트 간 공유 상태                              |
| `src/hooks/useProfileActions.ts` | 앱 상태 및 액션                                  |
| `src/lib/profile-storage.ts`     | 가입 프로필 저장·복원                            |
| `src/types.ts`                   | 프로필·역할·선호·인증 타입                       |
| `src/data/`                      | 기존 추천 프로필과 가입용 8문항                  |
| `src/style.css`                  | 기존 다크 팔레트와 Galmuri/JetBrains Mono 디자인 |
| `data/value-questions.json`      | 전체 가치관 문항 뱅크 80개                       |
| `dist/`                          | Vite가 생성하는 배포 결과 (직접 편집하지 않음)   |

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
