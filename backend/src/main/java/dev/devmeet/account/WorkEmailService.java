package dev.devmeet.account;

import dev.devmeet.common.ApiException;
import dev.devmeet.common.MemberAccess;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkEmailService {
  private final MemberAccess access;
  private final JdbcTemplate jdbc;
  private final PasswordEncoder passwords;
  private final ObjectProvider<JavaMailSender> mail;
  private final String from;
  private final SecureRandom random = new SecureRandom();

  public WorkEmailService(
      MemberAccess access,
      JdbcTemplate jdbc,
      PasswordEncoder passwords,
      ObjectProvider<JavaMailSender> mail,
      @Value("${app.mail-from:no-reply@devmeet.invalid}") String from) {
    this.access = access;
    this.jdbc = jdbc;
    this.passwords = passwords;
    this.mail = mail;
    this.from = from;
  }

  public record VerifiedEmail(String company, String email, Instant verifiedAt) {}

  public record PendingEmail(String company, String email, Instant expiresAt, Instant resendAt) {}

  public record Status(boolean available, VerifiedEmail verified, PendingEmail pending) {}

  @Transactional(readOnly = true)
  public Status status(String principal) {
    String id = access.account(principal).getId().toString();
    var verified =
        jdbc.query(
            "SELECT company,email,verified_at FROM work_email_verifications WHERE"
                + " account_id=UUID_TO_BIN(?)",
            (rs, n) ->
                new VerifiedEmail(rs.getString(1), rs.getString(2), rs.getTimestamp(3).toInstant()),
            id);
    var pending =
        jdbc.query(
            """
            SELECT company,email,expires_at,created_at FROM work_email_challenges
            WHERE account_id=UUID_TO_BIN(?) AND consumed=false AND attempts<5
            AND expires_at>CURRENT_TIMESTAMP(6) ORDER BY created_at DESC LIMIT 1
            """,
            (rs, n) ->
                new PendingEmail(
                    rs.getString(1),
                    rs.getString(2),
                    rs.getTimestamp(3).toInstant(),
                    rs.getTimestamp(4).toInstant().plusSeconds(60)),
            id);
    return new Status(
        mail.getIfAvailable() != null,
        verified.isEmpty() ? null : verified.getFirst(),
        pending.isEmpty() ? null : pending.getFirst());
  }

  @Transactional
  public Status request(String principal, String company, String inputEmail) {
    var sender = mail.getIfAvailable();
    if (sender == null)
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "이메일 발송 서비스가 아직 준비되지 않았어요.");
    String id = access.account(principal).getId().toString();
    access.lock(UUID.fromString(id));
    String email = inputEmail.strip().toLowerCase(Locale.ROOT);
    company = company.strip();
    if (company.isEmpty()
        || !email.matches(
            "[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+"))
      throw new ApiException(HttpStatus.BAD_REQUEST, "회사명과 이메일 주소를 확인해 주세요.");
    Instant now = Instant.now();
    if (count("account_id=UUID_TO_BIN(?) AND created_at>?", id, now.minusSeconds(60)) > 0)
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "인증번호는 1분 후 다시 받을 수 있어요.");
    if (count("account_id=UUID_TO_BIN(?) AND created_at>?", id, now.minusSeconds(86400)) >= 10
        || count("email=? AND created_at>?", email, now.minusSeconds(86400)) >= 5)
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "오늘 인증번호 요청 한도를 초과했어요. 내일 다시 시도해 주세요.");
    String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
    jdbc.update(
        "UPDATE work_email_challenges SET consumed=true WHERE account_id=UUID_TO_BIN(?)", id);
    jdbc.update(
        "INSERT INTO work_email_challenges(id,account_id,company,email,code_hash,expires_at)"
            + " VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,?)",
        UUID.randomUUID().toString(),
        id,
        company,
        email,
        passwords.encode(code),
        Timestamp.from(now.plusSeconds(600)));
    var message = new SimpleMailMessage();
    message.setFrom(from);
    message.setTo(email);
    message.setSubject("DevMeet 회사 이메일 확인");
    message.setText(
        "인증번호: "
            + code
            + "\n10분 안에 입력해 주세요. 새 번호를 요청하면 이전 번호는 사용할 수 없어요.\n직접 요청하지 않았다면 이 메일을 무시해 주세요.");
    try {
      sender.send(message);
    } catch (MailException error) {
      // Roll back the new challenge and preserve any previous valid code.
      throw new ApiException(HttpStatus.BAD_GATEWAY, "이메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
    return status(principal);
  }

  private int count(String condition, String value, Instant since) {
    return jdbc.queryForObject(
        "SELECT COUNT(*) FROM work_email_challenges WHERE " + condition,
        Integer.class,
        value,
        Timestamp.from(since));
  }

  // Incorrect attempts must persist even though the API returns an error.
  @Transactional(noRollbackFor = ApiException.class)
  public Status verify(String principal, String code) {
    String id = access.account(principal).getId().toString();
    access.lock(UUID.fromString(id));
    var rows =
        jdbc.queryForList(
            """
            SELECT BIN_TO_UUID(id) id,company,email,code_hash FROM work_email_challenges
            WHERE account_id=UUID_TO_BIN(?) AND consumed=false AND attempts<5
            AND expires_at>CURRENT_TIMESTAMP(6) ORDER BY created_at DESC LIMIT 1
            """,
            id);
    if (rows.isEmpty()) throw invalid();
    var row = rows.getFirst();
    String challenge = row.get("id").toString();
    jdbc.update(
        "UPDATE work_email_challenges SET attempts=attempts+1 WHERE id=UUID_TO_BIN(?)", challenge);
    if (!passwords.matches(code, row.get("code_hash").toString())) throw invalid();
    try {
      if (jdbc.queryForObject(
              "SELECT COUNT(*) FROM work_email_verifications WHERE account_id=UUID_TO_BIN(?)",
              Integer.class,
              id)
          > 0)
        jdbc.update(
            "UPDATE work_email_verifications SET company=?,email=?,verified_at=CURRENT_TIMESTAMP(6)"
                + " WHERE account_id=UUID_TO_BIN(?)",
            row.get("company"),
            row.get("email"),
            id);
      else
        jdbc.update(
            "INSERT INTO work_email_verifications(account_id,company,email)"
                + " VALUES(UUID_TO_BIN(?),?,?)",
            id,
            row.get("company"),
            row.get("email"));
    } catch (DuplicateKeyException error) {
      throw new ApiException(HttpStatus.CONFLICT, "이미 다른 회원이 인증한 이메일이에요.");
    }
    jdbc.update(
        "UPDATE work_email_challenges SET consumed=true WHERE id=UUID_TO_BIN(?)", challenge);
    return status(principal);
  }

  private ApiException invalid() {
    return new ApiException(HttpStatus.BAD_REQUEST, "인증번호가 틀렸거나 만료됐어요. 5회 실패하면 새 번호를 받아 주세요.");
  }
}
