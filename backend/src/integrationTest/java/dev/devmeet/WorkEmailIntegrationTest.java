package dev.devmeet;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.devmeet.account.*;
import dev.devmeet.common.ApiException;
import java.net.*;
import java.net.http.*;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("integration")
class WorkEmailIntegrationTest {
  @Autowired WorkEmailService service;
  @Autowired RegistrationService registration;
  @Autowired SocialAccounts social;
  @Autowired JdbcTemplate jdbc;
  @MockitoBean JavaMailSender mail;
  @LocalServerPort int port;
  @Autowired JsonMapper json;

  private HttpResponse<String> call(
      HttpClient client, String method, String path, Object body, JsonNode csrf) throws Exception {
    var builder = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/api" + path));
    if (csrf != null) builder.header(csrf.get("headerName").asText(), csrf.get("token").asText());
    return client.send(
        builder
            .header("Content-Type", "application/json")
            .method(
                method,
                body == null
                    ? HttpRequest.BodyPublishers.noBody()
                    : HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
            .build(),
        HttpResponse.BodyHandlers.ofString());
  }

  @Test
  void httpFlowRequiresLoginAndCsrfValidatesInputAndReturnsNoCode() throws Exception {
    var client =
        HttpClient.newBuilder()
            .cookieHandler(new CookieManager(null, CookiePolicy.ACCEPT_ALL))
            .build();
    assertThat(call(client, "GET", "/work-email", null, null).statusCode()).isEqualTo(401);
    var csrf = json.readTree(call(client, "GET", "/csrf", null, null).body());
    assertThat(
            call(
                    client,
                    "POST",
                    "/register",
                    Map.of("email", email(), "password", "test-only-password"),
                    csrf)
                .statusCode())
        .isEqualTo(201);
    csrf = json.readTree(call(client, "GET", "/csrf", null, null).body());
    var input = Map.of("company", "Company", "email", email());
    assertThat(call(client, "POST", "/work-email/request", input, null).statusCode())
        .isEqualTo(403);
    assertThat(
            call(
                    client,
                    "POST",
                    "/work-email/request",
                    Map.of("company", "Company", "email", "invalid"),
                    csrf)
                .statusCode())
        .isEqualTo(400);
    var sent = call(client, "POST", "/work-email/request", input, csrf);
    assertThat(sent.statusCode()).isEqualTo(200);
    String code = code();
    assertThat(sent.body()).doesNotContain(code).doesNotContain("code_hash");
    assertThat(
            call(client, "POST", "/work-email/verify", Map.of("code", "12345"), csrf).statusCode())
        .isEqualTo(400);
    var verified = call(client, "POST", "/work-email/verify", Map.of("code", code), csrf);
    assertThat(verified.statusCode()).isEqualTo(200);
    assertThat(json.readTree(verified.body()).get("verified").get("email").asText())
        .isEqualTo(input.get("email"));
  }

  private String member() {
    return registration
        .register(UUID.randomUUID() + "@example.test", "test-only-password")
        .getEmail();
  }

  private String email() {
    return UUID.randomUUID() + "@company.test";
  }

  private String code() {
    var messages = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mail, atLeastOnce()).send(messages.capture());
    return messages.getValue().getText().split("인증번호: ")[1].substring(0, 6);
  }

  private void allowResend(String principal) {
    jdbc.update(
        "UPDATE work_email_challenges SET created_at=DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 61"
            + " SECOND) WHERE account_id=(SELECT id FROM accounts WHERE email=?)",
        principal);
  }

  @Test
  void socialMemberCanVerifyASeparateEmailWithoutVerifyingTheirLoginOrWorkplace() {
    String principal =
        social
            .resolve(
                "kakao", Long.toUnsignedString(UUID.randomUUID().getMostSignificantBits()), null)
            .getEmail();
    String target = email();
    var requested = service.request(principal, " Test Company ", target.toUpperCase());
    assertThat(requested.pending().email()).isEqualTo(target);
    assertThat(requested.verified()).isNull();
    String code = code();
    assertThat(
            jdbc.queryForObject(
                "SELECT code_hash FROM work_email_challenges WHERE email=?", String.class, target))
        .isNotEqualTo(code)
        .startsWith("$2");
    var completed = service.verify(principal, code);
    assertThat(completed.verified().company()).isEqualTo("Test Company");
    assertThat(completed.verified().email()).isEqualTo(target);
    assertThat(completed.pending()).isNull();
    assertThatThrownBy(() -> service.verify(principal, code)).isInstanceOf(ApiException.class);
    assertThat(
            jdbc.queryForObject(
                "SELECT email_verified FROM accounts WHERE email=?", Boolean.class, principal))
        .isFalse();
  }

  @Test
  void incorrectAttemptsPersistAndLockTheCodeAfterFiveFailures() {
    String principal = member(), target = email();
    service.request(principal, "Company", target);
    String correct = code();
    String wrong = correct.equals("000000") ? "000001" : "000000";
    for (int i = 0; i < 5; i++)
      assertThatThrownBy(() -> service.verify(principal, wrong)).isInstanceOf(ApiException.class);
    assertThat(
            jdbc.queryForObject(
                "SELECT attempts FROM work_email_challenges WHERE email=?", Integer.class, target))
        .isEqualTo(5);
    assertThatThrownBy(() -> service.verify(principal, correct)).isInstanceOf(ApiException.class);
    assertThat(service.status(principal).pending()).isNull();
  }

  @Test
  void cooldownResendExpirationAndAccountBindingAreEnforced() {
    String principal = member(), other = member(), target = email();
    service.request(principal, "Company", target);
    String old = code();
    assertThatThrownBy(() -> service.request(principal, "Company", target))
        .isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> service.verify(other, old)).isInstanceOf(ApiException.class);
    allowResend(principal);
    String next = email();
    service.request(principal, "New company", next);
    String current = code();
    assertThat(
            jdbc.queryForObject(
                "SELECT consumed FROM work_email_challenges WHERE email=?", Boolean.class, target))
        .isTrue();
    assertThat(service.status(principal).pending().email()).isEqualTo(next);
    jdbc.update(
        "UPDATE work_email_challenges SET expires_at=DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL 1"
            + " SECOND) WHERE email=?",
        next);
    assertThatThrownBy(() -> service.verify(principal, current)).isInstanceOf(ApiException.class);
  }

  @Test
  void aVerifiedEmailCannotBeClaimedByAnotherMemberAndReplacementRequiresANewCode() {
    String principal = member(), other = member(), target = email();
    service.request(principal, "Company", target);
    service.verify(principal, code());
    service.request(other, "Company", target);
    String duplicate = code();
    assertThatThrownBy(() -> service.verify(other, duplicate)).isInstanceOf(ApiException.class);
    assertThat(service.status(other).verified()).isNull();
    allowResend(principal);
    String replacement = email();
    service.request(principal, "New Company", replacement);
    assertThat(service.status(principal).verified().email()).isEqualTo(target);
    assertThat(service.verify(principal, code()).verified().email()).isEqualTo(replacement);
  }

  @Test
  void deliveryFailureRollsBackTheNewChallengeAndPreservesThePreviousCode() {
    String principal = member(), target = email();
    service.request(principal, "Company", target);
    String previous = code();
    allowResend(principal);
    doThrow(new MailSendException("test delivery failure"))
        .when(mail)
        .send(any(SimpleMailMessage.class));
    assertThatThrownBy(() -> service.request(principal, "Company", email()))
        .isInstanceOf(ApiException.class);
    assertThat(service.status(principal).pending().email()).isEqualTo(target);
    assertThat(service.verify(principal, previous).verified().email()).isEqualTo(target);
  }

  @Test
  void dailyLimitsStillApplyAfterCodesExpireOrAreConsumed() {
    String principal = member(), target = email();
    service.request(principal, "Company", target);
    for (int i = 0; i < 4; i++) {
      allowResend(principal);
      service.request(principal, "Company", target);
    }
    allowResend(principal);
    assertThatThrownBy(() -> service.request(principal, "Company", target))
        .isInstanceOf(ApiException.class);
    for (int i = 0; i < 5; i++) {
      service.request(principal, "Company", email());
      allowResend(principal);
    }
    assertThatThrownBy(() -> service.request(principal, "Company", email()))
        .isInstanceOf(ApiException.class);
  }
}
