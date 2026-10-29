# DevMeet backend

Java 21 · Spring Boot 4.1.2 · Spring Security · Spring Data JPA · MySQL · Flyway.

구현 범위: 이메일 가입·로그인·로그아웃, 내 정보, 프로필/가치관 저장, 공개 프로필 조회.
추천·좋아요·매칭·채팅·신고 API는 아직 구현하지 않았습니다.
FE는 현재 localStorage 목업을 사용하며 새 BE로 자동 전환되지 않습니다.

## 로컬 실행

JDK 21이 필요합니다. 설정은 Spring Boot의 프로필별 YAML 파일로 관리합니다.

| 파일                                               | 용도                             | Git 포함 |
| -------------------------------------------------- | -------------------------------- | -------- |
| `src/main/resources/application.yml`               | 공통 설정, 기본 프로필 `local`   | 포함     |
| `src/main/resources/application-local.yml`         | 개발 시 사용할 원격 DB 접속 정보 | 제외     |
| `src/main/resources/application-local.example.yml` | 로컬 설정 작성 예시              | 포함     |
| `src/main/resources/application-prod.yml`          | 운영 설정, 환경변수/Secret 참조  | 포함     |

새 체크아웃에서는 `backend/`에서 예시 파일을 복사하고 DB 정보를 수정합니다:

```sh
cp src/main/resources/application-local.example.yml src/main/resources/application-local.yml
```

`application-local.yml`:

```yaml
spring:
  datasource:
    url: jdbc:mysql://YOUR_DB_HOST:3306/YOUR_DB_NAME?connectionTimeZone=UTC
    username: YOUR_DB_USERNAME
    password: YOUR_DB_PASSWORD
```

```sh
./gradlew bootRun
```

기본 프로필이 `local`이므로 별도 옵션 없이 로컬 설정을 읽습니다.
IntelliJ에서도 같은 파일을 자동으로 읽습니다. 로컬 설정은 Git·Docker 빌드 컨텍스트와
배포 JAR에서 제외합니다. 기존 `database.properties`와 수동 import 설정은 제거했습니다.
원격 MySQL을 사용합니다. `application-local.yml`에 원격 호스트·포트·DB 이름·계정·비밀번호를
입력한 뒤 실행하세요. `local`은 BE 실행 프로필 이름이며 DB 위치를 의미하지 않습니다.
접속 대상 DB는 미리 생성되어 있어야 합니다. 실제 접속 정보는 Git에 포함하지 않습니다.
서버의 TLS 요구사항에 맞춰 JDBC URL과 인증서 설정을 추가하세요.

BE: http://127.0.0.1:8080. Flyway가 시작 시 테이블을 생성하고
Hibernate는 스키마 일치 여부를 검사합니다.

기본 로그인 계정은 자동 생성하지 않습니다.
FE 개발 서버에는 `/api` → `127.0.0.1:8080` 프록시를 설정했습니다.
FE의 API 어댑터 전환은 아직이며, 실제 연결에는 나머지 목업 API 구현도 필요합니다.

## API

| 메서드 | 경로                 | 응답/동작                                            |
| ------ | -------------------- | ---------------------------------------------------- |
| GET    | /actuator/health     | DB를 포함한 헬스체크                                 |
| GET    | /api/csrf            | `{ token, headerName }`                              |
| POST   | /api/register        | `{ email, password }` → 201, `{ user }`, 자동 로그인 |
| POST   | /api/login           | `{ email, password }` → `{ user }`                   |
| POST   | /api/logout          | 세션 폐기, 204                                       |
| GET    | /api/me              | `{ user }`, 비로그인은 `{ user: null }`              |
| PUT    | /api/profile         | FE Profile 형태의 요청 → `{ profile }`               |
| GET    | /api/value-questions | `{ sections, publicLimit: 10 }`                      |
| PUT    | /api/profile/values  | `{ valueAnswers }` → `{ profile }`                   |
| GET    | /api/people/{id}     | 로그인 필요, `{ person }`, 공개 답변만 반환          |

```json
{
  "valueAnswers": {
    "D01": { "choice": "집에서 휴식", "private": false },
    "L01": { "choice": null, "private": true }
  }
}
```

- 프로필 저장 시 `valueAnswers`를 생략하면 기존 답변을 유지하고, `{}`이면 지웁니다.
- 가치관 단독 저장은 프로필 작성이 끝난 사용자만 가능합니다.
- 공개 답변이 10개를 넘으면 400으로 거절하며 기존 저장값을 유지합니다.
- `private` 생략 시 비공개, `choice: null`은 건너뛰기이며 항상 비공개입니다.
- 문항 ID와 선택지를 검증합니다. 공개 조회는 비공개 답변·이메일·추천 조건을 제외합니다.
- 문항은 `src/main/resources/catalog/value-questions.json`에 정의합니다.
  FE는 `/api/value-questions` 응답으로 동일한 문항을 사용할 수 있습니다.
- 공개 한도는 MySQL INSERT/UPDATE 트리거로도 검사합니다. 프로필 수정은 계정 행을 잠근
  트랜잭션으로 직렬화합니다.
- 사진은 HTTPS URL 또는 JPEG/PNG/WebP data URL을 받습니다. 파일 업로드 API와
  스토리지 연동은 아직 없습니다.

## 세션과 CSRF

인증은 HttpOnly 세션 쿠키를 사용합니다. 비밀번호는 BCrypt로 해시하며
최소 10자·UTF-8 기준 최대 72바이트입니다. 세션은 서버 메모리에 저장하므로
BE가 재시작되면 다시 로그인해야 합니다.

1. `GET /api/csrf`를 호출하고 쿠키를 유지합니다.
2. POST/PUT/DELETE 요청마다 응답의 `headerName`에 `token`을 넣습니다.
3. 가입·로그인·로그아웃 후 CSRF 토큰을 다시 조회합니다.

로그인 전 가입 요청에도 CSRF 토큰이 필요합니다. 별도 CORS 허용 없이
Vite 프록시 또는 운영 리버스 프록시를 통해 같은 출처에서 호출합니다.
가입·로그인 시 세션 ID와 CSRF 토큰을 갱신합니다.

## 검증

```sh
./gradlew test bootJar
```

통합 테스트는 실제 MySQL의 **테스트 전용 DB**가 필요합니다.
Flyway가 테이블을 생성하고 테스트마다 별도 이메일로 계정을 만듭니다.

```sh
# backend/에서. 반드시 테스트 전용 DB를 사용하세요.
export TEST_DB_URL='jdbc:mysql://TEST_DB_HOST:3306/devmeet_test?connectionTimeZone=UTC'
export TEST_DB_USERNAME='테스트_DB_사용자'
export TEST_DB_PASSWORD='테스트_DB_비밀번호'
./gradlew integrationTest
```

개발·운영 DB를 통합 테스트 대상으로 지정하지 마세요.
CI에서만 일회용 MySQL 8.4 서비스를 띄워 단위/통합 테스트와 JAR 빌드를 실행합니다.
애플리케이션용 로컬 DB와 Docker Compose는 구성하지 않습니다.

## 컨테이너와 배포

저장소 루트에서:

```sh
docker build -f backend/Dockerfile -t devmeet-backend:local .
```

운영은 `SPRING_PROFILES_ACTIVE=prod`를 지정하고 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`를
환경변수 또는 배포 환경의 Secret으로 주입합니다. 운영 비밀번호를 YAML에 직접 적지 않습니다.
컨테이너 이미지는 `prod` 프로필을 기본 사용하며 8080 포트에서 실행합니다.
운영 프로필은 Secure 세션 쿠키를 사용하므로 HTTPS가 필요합니다.
FE의 `/api`를 BE로 프록시해야 합니다.
기존 k3s 배포는 FE만 배포합니다. BE 이미지 빌드/테스트를 CI에 추가했으며,
운영 BE 배포와 FE의 실제 API 전환은 수행하지 않았습니다.

MySQL은 8.4 LTS를 기준으로 구성했습니다. 마이그레이션 계정은 테이블·인덱스·트리거 생성 권한이
필요합니다. 바이너리 로그가 켜진 서버에서는 DBA가 `log_bin_trust_function_creators=1`을
설정하거나 별도 권한을 가진 마이그레이션 계정을 사용해야 합니다. 기존 PostgreSQL 데이터를 MySQL로 이관하는 작업은 수행하지 않았습니다.
