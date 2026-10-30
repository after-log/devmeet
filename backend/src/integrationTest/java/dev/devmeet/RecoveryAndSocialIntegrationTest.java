package dev.devmeet;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.devmeet.account.*;
import dev.devmeet.common.ApiException;
import java.util.UUID;
import org.junit.jupiter.api.*;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest
@ActiveProfiles("integration")
class RecoveryAndSocialIntegrationTest {
  @Autowired RegistrationService registration;
  @Autowired AccountRecovery recovery;
  @Autowired SocialAccounts social;
  @Autowired AccountRepository accounts;
  @Autowired JdbcTemplate jdbc;
  @Autowired PasswordEncoder encoder;
  @MockitoBean JavaMailSender mail;

  @Test
  void oneUseHashedResetTokenChangesPasswordAndRevokesSessions() {
    String email = UUID.randomUUID() + "@example.test";
    registration.register(email, "old-test-password");
    String session = UUID.randomUUID().toString();
    jdbc.update(
        "INSERT INTO SPRING_SESSION VALUES(?,?,0,0,604800,9999999999999,?)",
        session,
        session,
        email);
    recovery.requestReset(email);
    var messages = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mail).send(messages.capture());
    String token = messages.getValue().getText().split("token=")[1].split("\n")[0];
    assertThat(
            jdbc.queryForObject(
                "SELECT token_hash FROM account_tokens WHERE account_id=(SELECT id FROM accounts"
                    + " WHERE email=?)",
                String.class,
                email))
        .isNotEqualTo(token)
        .hasSize(64);
    recovery.consume(token, "RESET", "new-test-password");
    assertThat(
            encoder.matches(
                "new-test-password", accounts.findByEmail(email).orElseThrow().getPasswordHash()))
        .isTrue();
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", Integer.class, email))
        .isZero();
    assertThatThrownBy(() -> recovery.consume(token, "RESET", "another-password"))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void emailVerificationRequiresTheCorrectPurposeAndCannotBeReused() {
    String email = UUID.randomUUID() + "@example.test";
    registration.register(email, "test-only-password");
    recovery.requestVerification(email);
    var messages = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mail).send(messages.capture());
    String token = messages.getValue().getText().split("token=")[1].split("\n")[0];
    assertThatThrownBy(() -> recovery.consume(token, "RESET", "new-test-password"))
        .isInstanceOf(ApiException.class);
    recovery.consume(token, "VERIFY", null);
    assertThat(accounts.findByEmail(email).orElseThrow().isEmailVerified()).isTrue();
    assertThatThrownBy(() -> recovery.consume(token, "VERIFY", null))
        .isInstanceOf(ApiException.class);
  }

  @Test
  void providerIdentityCannotBeLinkedToTwoAccountsOrSilentlyUseAnEmailAccount() {
    var first = registration.register(UUID.randomUUID() + "@example.test", "test-only-password");
    var second = registration.register(UUID.randomUUID() + "@example.test", "test-only-password");
    String subject = Long.toUnsignedString(UUID.randomUUID().getMostSignificantBits());
    assertThat(social.resolve("github", subject, first.getEmail()).getId())
        .isEqualTo(first.getId());
    assertThat(social.resolve("github", subject, null).getId()).isEqualTo(first.getId());
    assertThatThrownBy(() -> social.resolve("github", subject, second.getEmail()))
        .isInstanceOf(ApiException.class);
    var created = social.resolve("kakao", subject, null);
    assertThat(created.getId()).isNotEqualTo(first.getId()).isNotEqualTo(second.getId());
    assertThat(created.getEmail()).endsWith("@oauth.devmeet.invalid");
  }
}
