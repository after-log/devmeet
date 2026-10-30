package dev.devmeet.account;

import dev.devmeet.common.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;

@Service
public class AccountRecovery {
  private final AccountRepository accounts;
  private final MemberAccess access;
  private final JdbcTemplate jdbc;
  private final PasswordEncoder passwords;
  private final ObjectProvider<JavaMailSender> mail;
  private final String publicUrl, from;

  public AccountRecovery(
      AccountRepository accounts,
      MemberAccess access,
      JdbcTemplate jdbc,
      PasswordEncoder passwords,
      ObjectProvider<JavaMailSender> mail,
      @Value("${app.public-url}") String publicUrl,
      @Value("${app.mail-from:no-reply@devmeet.invalid}") String from) {
    this.accounts = accounts;
    this.access = access;
    this.jdbc = jdbc;
    this.passwords = passwords;
    this.mail = mail;
    this.publicUrl = publicUrl;
    this.from = from;
  }

  public boolean available() {
    return mail.getIfAvailable() != null;
  }

  private void requireMail() {
    if (!available())
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "이메일 발송 서비스가 아직 준비되지 않았어요.");
  }

  static String hash(String token) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException impossible) {
      throw new IllegalStateException(impossible);
    }
  }

  @Transactional
  public void requestReset(String email) {
    requireMail();
    accounts
        .findByEmail(email.strip().toLowerCase(Locale.ROOT))
        .filter(a -> !a.isSuspended())
        .ifPresent(a -> issue(a, "RESET"));
  }

  @Transactional
  public void requestVerification(String email) {
    requireMail();
    var account = access.account(email);
    if (account.getEmail().endsWith("@oauth.devmeet.invalid"))
      throw new ApiException(HttpStatus.BAD_REQUEST, "소셜 계정은 연결된 서비스에서 인증돼요.");
    if (!account.isEmailVerified()) issue(account, "VERIFY");
  }

  private void issue(Account account, String purpose) {
    access.lock(account.getId());
    // Throttle per account without retaining plaintext tokens.
    var recent =
        jdbc.queryForObject(
            "SELECT COUNT(*) FROM account_tokens WHERE account_id=UUID_TO_BIN(?) AND purpose=? AND"
                + " expires_at>?",
            Integer.class,
            account.getId().toString(),
            purpose,
            java.sql.Timestamp.from(
                Instant.now()
                    .plusSeconds(purpose.equals("RESET") ? 14 * 60 : 23 * 3600 + 59 * 60)));
    if (recent > 0) return;
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    jdbc.update(
        "UPDATE account_tokens SET consumed=true WHERE account_id=UUID_TO_BIN(?) AND purpose=?",
        account.getId().toString(),
        purpose);
    jdbc.update(
        "INSERT INTO account_tokens(token_hash,account_id,purpose,expires_at)"
            + " VALUES(?,UUID_TO_BIN(?),?,?)",
        hash(token),
        account.getId().toString(),
        purpose,
        java.sql.Timestamp.from(Instant.now().plusSeconds(purpose.equals("RESET") ? 900 : 86400)));
    var message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(account.getEmail());
    message.setSubject(purpose.equals("RESET") ? "DevMeet 비밀번호 재설정" : "DevMeet 이메일 확인");
    message.setText(
        publicUrl
            + "/auth/"
            + (purpose.equals("RESET") ? "reset" : "verify")
            + "?token="
            + token
            + "\n이 링크는 한 번만 사용할 수 있습니다.");
    // Sending failure rolls back token creation, allowing a retry.
    try {
      mail.getObject().send(message);
    } catch (org.springframework.mail.MailException error) {
      throw new ApiException(HttpStatus.BAD_GATEWAY, "이메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  @Transactional
  public void consume(String token, String purpose, String password) {
    if (token == null || !token.matches("[A-Za-z0-9_-]{43}")) throw invalid();
    String digest = hash(token);
    var ids =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(account_id) FROM account_tokens WHERE token_hash=? AND purpose=?"
                + " AND consumed=false AND expires_at>CURRENT_TIMESTAMP(6)",
            String.class,
            digest,
            purpose);
    if (ids.isEmpty()) throw invalid();
    UUID id = UUID.fromString(ids.getFirst());
    access.lock(id);
    int changed =
        jdbc.update(
            "UPDATE account_tokens SET consumed=true WHERE token_hash=? AND consumed=false AND"
                + " expires_at>CURRENT_TIMESTAMP(6)",
            digest);
    if (changed != 1) throw invalid();
    if (purpose.equals("VERIFY"))
      jdbc.update("UPDATE accounts SET email_verified=true WHERE id=UUID_TO_BIN(?)", id.toString());
    else {
      if (password == null
          || password.length() < 10
          || password.getBytes(StandardCharsets.UTF_8).length > 72)
        throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 10자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.");
      jdbc.update(
          "UPDATE accounts SET password_hash=? WHERE id=UUID_TO_BIN(?)",
          passwords.encode(password),
          id.toString());
      String email = accounts.findById(id).orElseThrow().getEmail();
      jdbc.update("DELETE FROM SPRING_SESSION WHERE PRINCIPAL_NAME=?", email);
    }
  }

  private ApiException invalid() {
    return new ApiException(HttpStatus.BAD_REQUEST, "만료되었거나 사용할 수 없는 링크예요.");
  }
}
