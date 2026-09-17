# devmeet

검증된 개발자와, 개발자를 만나고 싶은 사람을 연결하는 소개팅 앱 프로토타입.
빌드 도구 없이 동작하는 정적 목업입니다.

## 미리보기

- 첫 방문: `$ devmeet init` 가입 플로우부터 시작
- 재방문: 발견 화면으로 바로 진입 (`localStorage`)
- 헤더의 `⌘` 버튼으로 가입 흐름을 언제든 다시 볼 수 있습니다

## 화면 흐름

```
$ devmeet init
  ├─ 01 IDENTITY    역할(개발자 / 개발자를 만나고 싶은 사람) + 프로필 이름
  ├─ 02 TRUST       회사 이메일 인증 · GitHub 연결 (역할에 따라 분기)
  ├─ 03 VALUES      가치관 O/X 8문항
  ├─ 04 PREFERENCE  만나고 싶은 사람 · 연애 가치관 · 만남 시간
  └─ build complete me.profile.ts 카드 확인 → 발견

발견 → 호감 → (상호 호감) → 대화
```

## 구조

| 경로 | 설명 |
|---|---|
| `dist/index.html` | 앱 셸 |
| `dist/app.js` | 전체 화면 렌더링 · 상태 |
| `dist/style.css` | 디자인 시스템 (IntelliJ 다크 팔레트 + JetBrains Mono) |
| `data/value-questions.json` | 가치관 O/X 문항 뱅크 80개 (일상·연애·커리어·외모 각 20개) |

가입 플로우에서는 문항 뱅크 중 카테고리별 2개씩 8문항을 사용합니다.
`dealbreaker: true` 문항은 점수 가산이 아니라 필터/경고용으로 설계했습니다.

## 로컬 실행

```bash
node .claude/serve.js   # http://localhost:4173
```

## 배포

`main`에 푸시하면 GitHub Actions가 `dist/`를 GitHub Pages로 배포합니다.
레포 Settings → Pages → Source를 **GitHub Actions**로 설정해야 합니다.
