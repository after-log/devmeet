package dev.devmeet;

import static org.assertj.core.api.Assertions.*;

import java.awt.image.BufferedImage;
import java.io.*;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.*;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "app.admin.username=integration-operator",
      "app.photo-directory=./build/integration-photos"
    })
@ActiveProfiles("integration")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class CommunityHttpIntegrationTest {
  @org.springframework.test.context.DynamicPropertySource
  static void adminCredentials(org.springframework.test.context.DynamicPropertyRegistry registry) {
    registry.add("app.admin.password-hash",()->new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder(4).encode("test-only-password"));
  }
  @LocalServerPort int port;
  @Autowired JsonMapper json;
  @Autowired JdbcTemplate jdbc;
  @Autowired dev.devmeet.profile.QuestionCatalog catalog;
  Actor admin;

  class Actor {
    final HttpClient client =
        HttpClient.newBuilder()
            .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    String id;

    HttpResponse<String> call(String method, String path, Object body) throws Exception {
      var builder =
          HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api" + path))
              .timeout(Duration.ofSeconds(20));
      if (!method.equals("GET")) {
        var csrf =
            read(
                client.send(
                    HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + (path.startsWith("/admin") ? "/api/admin/auth/csrf" : "/api/csrf")))
                        .GET()
                        .build(),
                    HttpResponse.BodyHandlers.ofString()));
        builder.header(csrf.get("headerName").asText(), csrf.get("token").asText());
      }
      builder
          .header("Content-Type", "application/json")
          .method(
              method,
              body == null
                  ? HttpRequest.BodyPublishers.noBody()
                  : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
      return client.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    }

    JsonNode ok(String method, String path, Object body) throws Exception {
      var r = call(method, path, body);
      assertThat(r.statusCode())
          .withFailMessage("%s %s: %s", method, path, r.body())
          .isBetween(200, 299);
      return read(r);
    }

    String upload() throws Exception {
      var token = ok("GET", "/csrf", null);
      var image = new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB);
      var photo = new ByteArrayOutputStream();
      ImageIO.write(image, "png", photo);
      String boundary = "devmeet-test-boundary";
      var body = new ByteArrayOutputStream();
      body.write(
          ("--"
                  + boundary
                  + "\r\n"
                  + "Content-Disposition: form-data; name=\"file\"; filename=\"profile.png\"\r\n"
                  + "Content-Type: image/png\r\n\r\n")
              .getBytes(java.nio.charset.StandardCharsets.UTF_8));
      body.write(photo.toByteArray());
      body.write(
          ("\r\n--" + boundary + "--\r\n").getBytes(java.nio.charset.StandardCharsets.UTF_8));
      var request =
          HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/photo"))
              .header(token.get("headerName").asText(), token.get("token").asText())
              .header("Content-Type", "multipart/form-data; boundary=" + boundary)
              .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
              .build();
      var response = client.send(request, HttpResponse.BodyHandlers.ofString());
      assertThat(response.statusCode()).withFailMessage(response.body()).isEqualTo(200);
      return read(response).get("photo").asText();
    }
  }

  JsonNode read(HttpResponse<String> response) {
    return response.body().isBlank() ? json.createObjectNode() : json.readTree(response.body());
  }

  Actor register(String address) throws Exception {
    Actor actor = new Actor();
    actor.id =
        actor
            .ok("POST", "/register", Map.of("email", address, "password", "test-only-password"))
            .get("user")
            .get("id")
            .asText();
    assertThat(actor.ok("GET", "/me", null).get("user").get("id").asText()).isEqualTo(actor.id);
    return actor;
  }

  Actor member(String group, String role) throws Exception {
    Actor actor = register(UUID.randomUUID() + "@example.test");
    Map<String, Object> body = profileBody(group, role);
    body.put("photos", List.of(actor.upload(), actor.upload(), actor.upload()));
    actor.ok("PUT", "/profile", body);
    assertThat(actor.ok("GET", "/recommendations", null).get("people").size()).isZero();
    admin.ok(
        "PUT",
        "/admin/photos/" + actor.id,
        Map.of("status", "APPROVED", "reason", "통합 테스트 승인", "photos", body.get("photos")));
    return actor;
  }

  Map<String, Object> profileBody(String group, String role) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("name", "테스트");
    body.put("age", 29);
    body.put("height", 172);
    body.put("location", group);
    body.put("job", "개발자");
    body.put("education", "대학교 졸업");
    body.put("role", role);
    body.put("meeting", "주말에 1–2번");
    body.put("contact", "바쁜 날에도 짧은 안부");
    body.put("preference", "상관없어요");
    body.put("smoking", "비흡연");
    body.put("drinking", "가끔");
    body.put("religion", "무교");
    body.put("intro", "테스트 프로필");
    body.put("tags", List.of("산책"));
    body.put("minAge", 19);
    body.put("maxAge", 60);
    body.put("region", group);
    return body;
  }

  @BeforeAll
  void administrator() throws Exception {
    admin = new Actor();
    admin.ok("POST", "/admin/auth/login", Map.of("id", "integration-operator", "password", "test-only-password"));
  }

  @Test
  void administratorCatalogChangesReachMembersAndPreserveInactiveAnswers() throws Exception {
    String id=admin.ok("POST","/admin/questions",Map.of("section","일상","text","통합 테스트 문항","purpose","매칭","options",List.of("하나","둘","셋","넷"))).get("id").asText();
    try {
      assertThat(catalog.matchingIds()).contains(id);
      Actor actor=member("가치관 "+UUID.randomUUID(),"non-developer");
      actor.ok("PUT","/profile/values",Map.of("valueAnswers",Map.of(id,Map.of("choice","하나","private",false))));
      assertThat(admin.ok("GET","/admin/accounts",null).toString()).contains(actor.id);
      admin.ok("PUT","/admin/questions/"+id,Map.of("active",false));
      assertThat(catalog.matchingIds()).doesNotContain(id);
      assertThat(actor.ok("GET","/value-questions",null).get("sections").toString()).doesNotContain(id);
      var saved=actor.ok("PUT","/profile/values",Map.of("valueAnswers",Map.of())).get("profile").get("valueAnswers").get(id);
      assertThat(saved.get("choice").asText()).isEqualTo("하나");
      assertThat(saved.get("private").asBoolean()).isTrue();
      assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM admin_audit WHERE action='QUESTION_CREATE' AND note LIKE ?",Integer.class,id+":%" )).isEqualTo(1);
    } finally { admin.ok("PUT","/admin/questions/"+id,Map.of("active",false)); }
  }

  @Test
  void completeMatchChatReportBlockAndPrivatePhotoFlow() throws Exception {
    String group = "서울시 " + UUID.randomUUID();
    Actor a = member(group, "developer"), b = member(group, "non-developer");
    var recommendations = a.ok("GET", "/recommendations", null);
    assertThat(recommendations.get("people").size()).isEqualTo(1);
    assertThat(a.ok("GET", "/recommendations", null).get("people"))
        .isEqualTo(recommendations.get("people"));
    b.ok("GET", "/recommendations", null);
    assertThat(a.call("GET", "/messages/" + b.id, null).statusCode()).isEqualTo(403);
    assertThat(a.ok("POST", "/likes", Map.of("id", b.id)).get("matched").asBoolean()).isFalse();
    assertThat(b.ok("POST", "/likes", Map.of("id", a.id)).get("matched").asBoolean()).isTrue();
    assertThat(a.ok("GET", "/connections", null).get("matches").size()).isEqualTo(1);
    var sent = a.ok("POST", "/messages/" + b.id, Map.of("text", "안녕하세요"));
    assertThat(sent.get("message").get("sender").asText()).isEqualTo(a.id);
    var history = b.ok("GET", "/messages/" + a.id, null);
    assertThat(history.get("messages").get(0).get("text").asText()).isEqualTo("안녕하세요");
    assertThat(a.ok("POST", "/likes", Map.of("id", b.id)).get("matched").asBoolean()).isTrue();
    assertThat(a.ok("GET", "/recommendations", null).get("remaining").asInt()).isEqualTo(2);

    var report = a.ok("POST", "/report", Map.of("id", b.id, "reason", "테스트 신고"));
    admin.ok(
        "PUT",
        "/admin/reports/" + report.get("id").asText(),
        Map.of("status", "VALID", "note", "확인"));
    assertThat(a.call("GET", "/admin", null).statusCode()).isEqualTo(401);
    String photo = a.ok("GET", "/people/" + b.id, null).get("person").get("photo").asText();
    a.ok("POST", "/block", Map.of("id", b.id));
    assertThat(a.ok("GET", "/connections", null).get("matches").size()).isZero();
    assertThat(b.call("POST", "/messages/" + a.id, Map.of("text", "보이면 안 됨")).statusCode())
        .isEqualTo(404);
    assertThat(a.call("GET", photo.substring(4), null).statusCode()).isEqualTo(404);
    assertThat(a.ok("GET", "/blocks", null).get("people").size()).isEqualTo(1);
    a.ok("DELETE", "/blocks/" + b.id, null);
    assertThat(a.ok("GET", "/connections", null).get("matches").size()).isEqualTo(1);
    admin.ok("PUT", "/admin/accounts/" + b.id, Map.of("suspended", true, "reason", "테스트 제한"));
    assertThat(b.call("GET", "/me", null).statusCode()).isEqualTo(403);
    assertThat(a.ok("GET", "/connections", null).get("matches").size()).isZero();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM SPRING_SESSION", Integer.class))
        .isPositive();
  }

  @Test
  void galleryRequiresThreeOwnedPhotosAndFreshApprovalBeforePublicAccess() throws Exception {
    Actor owner = register(UUID.randomUUID() + "@example.test");
    Actor viewer = register(UUID.randomUUID() + "@example.test");
    var body = profileBody("사진 테스트", "non-developer");
    String first = owner.upload(), second = owner.upload(), third = owner.upload();
    body.put("photos", List.of(first, second, third, first, second, third, first));
    assertThat(owner.call("PUT", "/profile", body).statusCode()).isEqualTo(400);
    body.put("photos", List.of(first, second));
    assertThat(owner.call("PUT", "/profile", body).statusCode()).isEqualTo(400);
    body.put("photos", List.of(first, first, second));
    assertThat(owner.call("PUT", "/profile", body).statusCode()).isEqualTo(400);
    body.put("photos", List.of(first, second, viewer.upload()));
    assertThat(owner.call("PUT", "/profile", body).statusCode()).isEqualTo(403);
    var original = List.of(first, second, third);
    body.put("photos", original);
    var saved = owner.ok("PUT", "/profile", body).get("profile");
    assertThat(saved.get("photos").size()).isEqualTo(3);
    assertThat(saved.get("photo").asText()).isEqualTo(first);
    assertThat(viewer.call("GET", "/people/" + owner.id, null).statusCode()).isEqualTo(404);
    assertThat(viewer.call("GET", third.substring(4), null).statusCode()).isEqualTo(404);
    admin.ok(
        "PUT",
        "/admin/photos/" + owner.id,
        Map.of("status", "APPROVED", "reason", "", "photos", original));
    assertThat(viewer.ok("GET", "/people/" + owner.id, null).get("person").get("photos").size())
        .isEqualTo(3);
    assertThat(viewer.call("GET", third.substring(4), null).statusCode()).isEqualTo(200);
    body.put("intro", "사진 외 소개만 변경");
    owner.ok("PUT", "/profile", body);
    assertThat(
            owner
                .ok("GET", "/me", null)
                .get("user")
                .get("verification")
                .get("photoStatus")
                .asText())
        .isEqualTo("APPROVED");
    String replacement = owner.upload();
    var changed = List.of(first, second, replacement);
    body.put("photos", changed);
    owner.ok("PUT", "/profile", body);
    assertThat(
            owner
                .ok("GET", "/me", null)
                .get("user")
                .get("verification")
                .get("photoStatus")
                .asText())
        .isEqualTo("PENDING");
    assertThat(viewer.call("GET", first.substring(4), null).statusCode()).isEqualTo(404);
    assertThat(
            admin
                .call(
                    "PUT",
                    "/admin/photos/" + owner.id,
                    Map.of("status", "APPROVED", "reason", "", "photos", original))
                .statusCode())
        .isEqualTo(409);
    admin.ok(
        "PUT",
        "/admin/photos/" + owner.id,
        Map.of("status", "REJECTED", "reason", "얼굴이 보이도록 등록해 주세요", "photos", changed));
    assertThat(viewer.call("GET", replacement.substring(4), null).statusCode()).isEqualTo(404);
    admin.ok(
        "PUT",
        "/admin/photos/" + owner.id,
        Map.of("status", "APPROVED", "reason", "", "photos", changed));
    assertThat(viewer.call("GET", replacement.substring(4), null).statusCode()).isEqualTo(200);
    assertThat(viewer.call("GET", third.substring(4), null).statusCode()).isEqualTo(404);
    viewer.ok("POST", "/block", Map.of("id", owner.id));
    assertThat(viewer.call("GET", replacement.substring(4), null).statusCode()).isEqualTo(404);
  }

  @Test
  void concurrentMutualLikesCreateOnlyOneMatch() throws Exception {
    String group = "경기도 " + UUID.randomUUID();
    Actor a = member(group, "developer"), b = member(group, "non-developer");
    a.ok("GET", "/recommendations", null);
    b.ok("GET", "/recommendations", null);
    try (var executor = Executors.newFixedThreadPool(2)) {
      var first = executor.submit(() -> a.call("POST", "/likes", Map.of("id", b.id)));
      var second = executor.submit(() -> b.call("POST", "/likes", Map.of("id", a.id)));
      assertThat(first.get(30, TimeUnit.SECONDS).statusCode()).isEqualTo(200);
      assertThat(second.get(30, TimeUnit.SECONDS).statusCode()).isEqualTo(200);
    }
    assertThat(a.ok("GET", "/connections", null).get("matches").size()).isEqualTo(1);
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM matches WHERE first_id=UUID_TO_BIN(?) AND"
                    + " second_id=UUID_TO_BIN(?)",
                Integer.class,
                dev.devmeet.matching.MatchingService.first(
                    UUID.fromString(a.id), UUID.fromString(b.id)),
                dev.devmeet.matching.MatchingService.second(
                    UUID.fromString(a.id), UUID.fromString(b.id))))
        .isEqualTo(1);
  }

  @Test
  void assignmentsStayFixedAndLikesAreLimitedToThree() throws Exception {
    String group = "서울시 " + UUID.randomUUID();
    Actor a = member(group, "developer");
    for (int i = 0; i < 4; i++) member(group, "non-developer");
    var people = a.ok("GET", "/recommendations", null).get("people");
    assertThat(people.size()).isEqualTo(3);
    try (var executor = Executors.newFixedThreadPool(3)) {
      var futures = new ArrayList<Future<HttpResponse<String>>>();
      people.forEach(
          p ->
              futures.add(
                  executor.submit(
                      () -> a.call("POST", "/likes", Map.of("id", p.get("id").asText())))));
      for (var future : futures)
        assertThat(future.get(30, TimeUnit.SECONDS).statusCode()).isEqualTo(200);
    }
    assertThat(a.ok("GET", "/recommendations", null).get("remaining").asInt()).isZero();
    assertThat(a.ok("GET", "/recommendations", null).get("people")).isEqualTo(people);
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM likes WHERE sender_id=UUID_TO_BIN(?)", Integer.class, a.id))
        .isEqualTo(3);
  }

  @Test
  void unconfiguredOAuthIsReportedHonestly() throws Exception {
    assertThat(new Actor().ok("GET", "/auth/providers", null).get("github").asBoolean()).isFalse();
  }

  @Test
  void realtimeNotificationAndHistoryPaginationAreAuthorized() throws Exception {
    String group = "경기도 " + UUID.randomUUID();
    Actor a = member(group, "developer"), b = member(group, "non-developer");
    a.ok("GET", "/recommendations", null);
    b.ok("GET", "/recommendations", null);
    a.ok("POST", "/likes", Map.of("id", b.id));
    b.ok("POST", "/likes", Map.of("id", a.id));
    var stream =
        a.client.send(
            HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api/events"))
                .GET()
                .build(),
            HttpResponse.BodyHandlers.ofInputStream());
    assertThat(stream.statusCode()).isEqualTo(200);
    var executor = Executors.newSingleThreadExecutor();
    try {
      var reader =
          new BufferedReader(
              new InputStreamReader(stream.body(), java.nio.charset.StandardCharsets.UTF_8));
      var notified =
          executor.submit(
              () ->
                  reader
                      .lines()
                      .filter(line -> line.equals("event:message"))
                      .findFirst()
                      .isPresent());
      b.ok("POST", "/messages/" + a.id, Map.of("text", "실시간 알림"));
      assertThat(notified.get(15, TimeUnit.SECONDS)).isTrue();
    } finally {
      stream.body().close();
      executor.shutdownNow();
    }
    String match =
        jdbc.queryForObject(
            "SELECT BIN_TO_UUID(id) FROM matches WHERE first_id=UUID_TO_BIN(?) AND"
                + " second_id=UUID_TO_BIN(?)",
            String.class,
            dev.devmeet.matching.MatchingService.first(
                UUID.fromString(a.id), UUID.fromString(b.id)),
            dev.devmeet.matching.MatchingService.second(
                UUID.fromString(a.id), UUID.fromString(b.id)));
    for (int i = 0; i < 105; i++)
      jdbc.update(
          "INSERT INTO messages(id,match_id,sender_id,body)"
              + " VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?)",
          UUID.randomUUID().toString(),
          match,
          a.id,
          "이전 메시지 " + i);
    var page = a.ok("GET", "/messages/" + b.id, null);
    assertThat(page.get("messages").size()).isEqualTo(100);
    String cursor = page.get("nextCursor").asText();
    var older = a.ok("GET", "/messages/" + b.id + "?before=" + cursor, null);
    assertThat(older.get("messages").size()).isEqualTo(6);
    assertThat(older.get("nextCursor").isNull()).isTrue();
    a.ok("POST", "/block", Map.of("id", b.id));
    assertThat(b.call("GET", "/messages/" + a.id, null).statusCode()).isEqualTo(404);
  }
}
