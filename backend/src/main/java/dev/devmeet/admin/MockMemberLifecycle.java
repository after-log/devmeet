package dev.devmeet.admin;

import dev.devmeet.photo.PhotoService;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MockMemberLifecycle {
  private final JdbcTemplate jdbc;
  private final PhotoService photos;

  public MockMemberLifecycle(JdbcTemplate jdbc, PhotoService photos) {
    this.jdbc = jdbc;
    this.photos = photos;
  }

  public record Status(boolean enabled, int count) {}

  public record Deletion(int deleted) {}

  public Status status() {
    return jdbc.queryForObject(
        "SELECT enabled, (SELECT COUNT(*) FROM accounts WHERE mock_member) AS count "
            + "FROM mock_member_settings WHERE id=1",
        (row, index) -> new Status(row.getBoolean("enabled"), row.getInt("count")));
  }

  public boolean enabled() {
    return Boolean.TRUE.equals(
        jdbc.queryForObject("SELECT enabled FROM mock_member_settings WHERE id=1", Boolean.class));
  }

  boolean lockEnabled() {
    return Boolean.TRUE.equals(jdbc.queryForObject(
        "SELECT enabled FROM mock_member_settings WHERE id=1 FOR UPDATE", Boolean.class));
  }

  @Transactional
  public Status setEnabled(String actor, boolean enabled) {
    if (lockEnabled() != enabled) {
      updateSetting(enabled);
      jdbc.update("UPDATE accounts SET mock_disabled=? WHERE mock_member", !enabled);
      audit(actor, enabled ? "MOCK_MEMBER_ENABLE" : "MOCK_MEMBER_DISABLE");
    }
    return status();
  }

  @Transactional
  public Deletion purge(String actor) {
    lockEnabled();
    updateSetting(false);
    // Match and chat writes lock accounts in binary UUID order as well.
    var accounts = jdbc.queryForList(
        "SELECT BIN_TO_UUID(id) FROM accounts WHERE mock_member ORDER BY id FOR UPDATE",
        String.class);
    if (accounts.isEmpty()) return new Deletion(0);

    var images = jdbc.queryForList("""
        SELECT BIN_TO_UUID(p.id) FROM photos p JOIN accounts a ON a.id=p.owner_id WHERE a.mock_member
        """, String.class).stream().map(UUID::fromString).toList();
    audit(actor, "MOCK_MEMBER_DELETE");
    jdbc.update("""
        DELETE m FROM messages m JOIN matches p ON p.id=m.match_id
        JOIN accounts a ON a.id IN (m.sender_id,p.first_id,p.second_id) WHERE a.mock_member
        """);
    jdbc.update("""
        DELETE m FROM matches m JOIN accounts a ON a.id IN (m.first_id,m.second_id)
        WHERE a.mock_member
        """);
    jdbc.update("""
        DELETE r FROM recommendations r JOIN accounts a ON a.id IN (r.owner_id,r.target_id)
        WHERE a.mock_member
        """);
    for (String table : List.of("likes", "blocks", "reports")) {
      jdbc.update("DELETE r FROM " + table + " r JOIN accounts a ON a.id IN (r.sender_id,r.target_id)"
          + " WHERE a.mock_member");
    }
    for (String table : List.of("account_tokens", "work_email_challenges", "work_email_verifications",
        "company_email_reviews", "oauth_identities")) {
      jdbc.update("DELETE r FROM " + table + " r JOIN accounts a ON a.id=r.account_id WHERE a.mock_member");
    }
    for (String table : List.of("photos", "recommendation_batches")) {
      jdbc.update("DELETE r FROM " + table + " r JOIN accounts a ON a.id=r.owner_id WHERE a.mock_member");
    }
    jdbc.update("""
        DELETE s FROM SPRING_SESSION s JOIN accounts a
          ON CAST(a.email AS BINARY)=CAST(s.PRINCIPAL_NAME AS BINARY)
        WHERE a.mock_member
        """);
    int deleted = jdbc.update("DELETE FROM accounts WHERE mock_member");
    photos.deleteAfterCommit(images);
    return new Deletion(deleted);
  }

  private void updateSetting(boolean enabled) {
    jdbc.update("UPDATE mock_member_settings SET enabled=? WHERE id=1", enabled);
  }

  private void audit(String actor, String action) {
    jdbc.update("""
        INSERT INTO admin_audit(actor,action,target_id,note)
        SELECT ?,?,id,'' FROM accounts WHERE mock_member
        """, actor, action);
  }
}
