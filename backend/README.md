# DevMeet backend

Java 21 · Spring Boot 4.1.2 · Spring Security · JPA/JDBC · MySQL 8.4 LTS · Flyway.
FE는 실제 API를 사용합니다. 가상 인물은 가입 없는 둘러보기에서만 사용합니다.

## 실행

`backend/src/main/resources/application-local.yml`에 **원격 MySQL** 접속 정보를 입력합니다.
이 파일은 Git·Docker 빌드 컨텍스트·배포 JAR에서 제외합니다. 이미 작성한 파일은 유지합니다.

```yaml
spring:
  datasource:
    url: jdbc:mysql://DB_HOST:3306/devmeet?connectionTimeZone=UTC
    username: DB_USERNAME
    password: "DB_PASSWORD"
app:
  public-url: http://localhost:5173
  admin-emails: "운영자로 지정할 이메일"
  photo-directory: ./data/photos
  require-github: false
```

새 체크아웃은 `application-local.example.yml`을 `application-local.yml`로 복사해 수정합니다.
`local`은 BE 실행 환경 이름이며 DB 위치와는 관계없습니다.

```sh
cd backend
./gradlew bootRun
```

다른 터미널에서 `frontend/`의 `npm run dev`를 실행합니다.
FE는 http://localhost:5173, BE는 http://127.0.0.1:8080 입니다.
기본 프로필은 `local`입니다. Flyway가 시작 시 스키마를 갱신하고 Hibernate가 검증합니다.
기존 localStorage 목업 계정은 이전하지 않으며 새로 가입해야 합니다.

## 구현 기능

- 이메일 가입·로그인·로그아웃, 이메일 확인, 비밀번호 재설정.
- HttpOnly 세션 쿠키, CSRF, BCrypt, 인증 요청 IP별 분당 60회 제한.
- JDBC 세션 저장으로 BE 재시작 후에도 로그인 유지.
- 프로필·추천 조건·가치관 저장, 비공개 기본값, 공개 답변 최대 10개.
- JPEG/PNG 사진 업로드·640px 리사이즈·서버 디스크 저장, 소유자/검수 권한 검사.
  FE는 WebP도 JPEG로 변환해 업로드합니다. 원본은 저장하지 않습니다.
- 운영자 사진 승인·반려, 신고 검토, 계정 이용 제한·해제, 처리 감사 로그.
- 한국 시간 자정 기준 하루 최대 세 명 추천. 같은 날 배정은 유지하며
  조건 변경은 다음 날 반영합니다. 사진 미승인·차단·이용 제한 계정은 제외합니다.
- 역할·상호 선호·상호 나이/지역 조건을 적용합니다. 만남·연락과 매칭용 가치관의
  선택 일치를 기준으로 정렬하며 선택지 숫자 간 거리는 궁합 점수로 쓰지 않습니다.
- 같은 상대 중복 좋아요 방지·하루 3회 제한·상호 좋아요 시 단일 매칭 생성.
- 매칭 상대 간 메시지 저장·커서 기반 100개 페이지 조회·SSE 갱신.
- 신고·차단·차단 해제. 양방향 차단이 없으면 기존 매칭은 다시 표시됩니다.
- GitHub·카카오 OAuth 로그인 및 기존 계정 연결. 제공자 이메일로 기존 계정을
  자동 합치지 않으며 동일 제공자 ID는 한 회원에게만 연결됩니다.

추천 배정과 좋아요/메시지는 계정 행 잠금을 사용합니다. 두 계정 잠금 순서를 통일하고
READ COMMITTED로 잠금 뒤 최신 상태를 읽어 동시 상호 좋아요와 차단을 처리합니다.
공개 답변 제한은 MySQL INSERT/UPDATE 트리거에서도 검사합니다.
문항 정의는 `src/main/resources/catalog/value-questions.json`입니다.

## 운영자와 사진 검수

`app.admin-emails`에 운영자 이메일을 쉼표로 지정하거나 `ADMIN_EMAILS`를 설정합니다.
일반 가입 화면에서 관리자 권한을 선택할 수 없습니다. 지정한 이메일로 가입/로그인한 뒤
`/admin`에 들어가 사진·신고를 검토합니다. 변경한 권한은 다시 로그인하면 반영됩니다.
관리자 API는 서버에서 `ROLE_ADMIN`을 검사하고 모든 처리에 감사 로그를 기록합니다.

새 사진 등록이나 변경 시 검수 상태는 PENDING입니다. 승인 전에 추천되지 않습니다.
관리자 자신이 프로필 작성을 마치지 않아도 `/admin`에 들어갈 수 있습니다.
`app.photo-directory`는 영구 저장소여야 하며 앱 재시작 때 지우지 마세요.
사진 조회는 로그인 필요, 소유자·관리자 또는 차단되지 않은 승인 프로필 조회자만 허용합니다.
신고 횟수만으로 자동 영구 차단하지 않고 운영자가 유효성을 검토합니다.

## 외부 연동 설정

앱 키가 없으면 해당 소셜 로그인 버튼을 제공하지 않습니다. 키를 등록한 경우에만
실제 제공자 인증을 시작하며, 미설정 상태를 인증 완료로 표시하지 않습니다.
로컬 개인 설정 또는 운영 Secret에 아래를 지정합니다.

```yaml
app:
  public-url: http://localhost:5173
  oauth:
    github:
      client-id: "GitHub OAuth 앱 ID"
      client-secret: "GitHub OAuth 앱 Secret"
    kakao:
      client-id: "카카오 REST API 키"
      client-secret: "카카오 Client Secret (사용하는 경우)"
```

운영 환경변수: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `KAKAO_CLIENT_ID`,
`KAKAO_CLIENT_SECRET`, `PUBLIC_URL`.
제공자 앱에 아래 콜백 URL을 등록합니다. `PUBLIC_URL`은 FE와 동일한 출처여야 합니다.

- GitHub: `{PUBLIC_URL}/login/oauth2/code/github`
- 카카오: `{PUBLIC_URL}/login/oauth2/code/kakao`

운영 `prod`는 개발자 추천 참여에 GitHub 연결을 요구합니다.
`REQUIRE_GITHUB=false`로 명시적으로 변경할 수 있으며 로컬 기본값은 false입니다.
GitHub 연결은 계정 소유 확인이며 재직/직무 인증을 뜻하지 않습니다.

이메일 인증·비밀번호 재설정에는 SMTP 설정이 필요합니다:

```yaml
spring:
  mail:
    host: SMTP_HOST
    port: 587
    username: SMTP_USERNAME
    password: "SMTP_PASSWORD"
app:
  mail-from: "인증된 발신 이메일"
```

운영은 `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`,
`SPRING_MAIL_PASSWORD`, `MAIL_FROM`을 주입합니다. SMTP는 기본 STARTTLS를 사용합니다.
설정이 없으면 메일 기능은 503으로 명확히 안내합니다. 토큰은 일회용이고 DB에는 해시만
저장합니다. 재설정은 15분, 이메일 확인은 24시간 유효하며 비밀번호 변경 시 기존 세션을 폐기합니다.
동일 계정의 메일 재요청은 1분 간격으로 제한하고 계정 존재 여부는 응답에 드러내지 않습니다.

## API

| 메서드      | 경로                                                 | 동작                                                       |
| ----------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| GET         | /api/csrf                                            | 토큰과 헤더 이름                                           |
| GET         | /api/me                                              | 현재 회원·프로필·검증 상태·관리자 여부                     |
| POST        | /api/register, /api/login                            | 이메일·비밀번호 인증                                       |
| POST        | /api/logout                                          | 로그아웃                                                   |
| PUT         | /api/profile                                         | 전체 프로필 저장                                           |
| PUT         | /api/profile/values                                  | `{ valueAnswers }` 저장                                    |
| GET         | /api/value-questions                                 | 문항과 공개 한도                                           |
| GET         | /api/people/{id}                                     | 공개 프로필과 최대 10개 공개 답변                          |
| POST        | /api/photo                                           | multipart `file` 업로드                                    |
| GET         | /api/photos/{id}                                     | 권한 검사 후 사진 조회                                     |
| GET         | /api/recommendations                                 | 오늘의 추천·좋아요 잔여 횟수·대기 안내                     |
| POST        | /api/likes                                           | `{ id }` 좋아요                                            |
| GET         | /api/connections                                     | 보낸·받은 좋아요와 매칭                                    |
| GET         | /api/messages/{id}?before={messageId}                | 매칭 상대의 메시지·nextCursor                              |
| POST        | /api/messages/{id}                                   | `{ text }` 메시지 전송                                     |
| GET         | /api/events                                          | ready/heartbeat/like/match/message/connections/profile SSE |
| POST        | /api/report                                          | `{ id, reason }` 신고                                      |
| POST        | /api/block                                           | `{ id }` 차단                                              |
| GET, DELETE | /api/blocks, /api/blocks/{id}                        | 차단 목록·해제                                             |
| GET         | /api/auth/providers, /api/auth/capabilities          | 사용 가능한 외부 연동                                      |
| POST        | /api/auth/{provider}/link                            | 현재 로그인 계정에 소셜 계정 연결 시작                     |
| POST        | /api/auth/password/request, /api/auth/password/reset | 재설정 요청·변경                                           |
| POST        | /api/auth/email/request, /api/auth/email/verify      | 이메일 확인 요청·완료                                      |
| GET         | /api/admin?page=0                                    | 회원 풀·통계·검수/신고 대기 50개씩                         |
| PUT         | /api/admin/photos/{id}                               | 사진 APPROVED/REJECTED 처리                                |
| PUT         | /api/admin/reports/{id}                              | 신고 VALID/DISMISSED 처리                                  |
| PUT         | /api/admin/accounts/{id}                             | suspended와 처리 사유                                      |
| GET         | /actuator/health, /actuator/health/readiness         | DB 포함 준비 상태                                          |

`GET /api/csrf`로 쿠키를 받고 POST/PUT/DELETE 요청의 응답 `headerName`에 `token`을 보냅니다.
가입·로그인·로그아웃 후에는 토큰을 다시 받습니다. OAuth 연결 시작도 POST + CSRF가 필요합니다.
외부 CORS를 열지 않고 Vite 또는 Ingress가 같은 출처로 요청을 전달합니다.
SSE는 알림 종류/상대 ID만 보내며 메시지 본문은 권한을 검사하는 REST API에서 조회합니다.
FE는 SSE 재연결과 30초 동기화를 함께 사용합니다.

## 테스트

```sh
./gradlew test bootJar
```

통합 테스트는 실제 MySQL의 **테스트 전용 DB**를 사용합니다. 개발/운영 DB는 지정하지 않습니다.

```sh
export TEST_DB_URL='jdbc:mysql://TEST_DB_HOST:3306/devmeet_test?connectionTimeZone=UTC'
export TEST_DB_USERNAME='TEST_DB_USERNAME'
export TEST_DB_PASSWORD='TEST_DB_PASSWORD'
./gradlew integrationTest
```

CI는 일회용 MySQL 8.4로 실행합니다. HTTP 테스트는 실제 서버·쿠키·JDBC 세션을 사용하며
동시 상호 좋아요, 일일 한도, 사진 업로드/검수, 신고/차단/제한, 메시지, SSE, 대화 페이지 조회를
검사합니다. 메일은 테스트 대역을 사용하고 실제 메일이나 OAuth 제공자 요청은 보내지 않습니다.

## 배포

`backend/Dockerfile`, `k8s-backend.yaml`, `k8s-manifest.yaml`, `scripts/deploy.sh`가
BE/FE 이미지·사진 PVC·Ingress 경로를 함께 구성합니다. 배포 스크립트는 두 이미지의
immutable SHA 태그와 롤백을 처리합니다. 스키마 마이그레이션은 자동 롤백하지 않습니다.
배포 전에 클러스터의 `devmeet-backend` Secret에 DB 접속 정보를 준비해야 합니다.
Git에 포함되지 않는 환경 파일에서 생성할 수 있습니다:

```sh
kubectl create secret generic devmeet-backend --from-env-file=/안전한/경로/devmeet-backend.env
```

필수 키는 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`입니다. 운영자·OAuth·SMTP 키는 위 설정대로
추가합니다. 운영 컨테이너는 `prod`, HTTPS Secure 쿠키를 사용하며 사진은 PVC에 저장합니다.
현재 배포는 사진 디스크와 SSE 발행을 단일 인스턴스로 운영하도록 replica=1입니다.
실제 운영 배포는 별도 실행해야 하며 소스 변경만으로 외부 서비스를 설정하지 않습니다.

마이그레이션 계정에는 테이블·인덱스·트리거 생성 권한이 필요합니다.
바이너리 로그가 켜진 서버는 DBA의 `log_bin_trust_function_creators=1` 설정 또는 별도의
마이그레이션 권한이 필요합니다. 기존 PostgreSQL 데이터는 자동 이전하지 않습니다.
