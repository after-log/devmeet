package dev.devmeet.moderation;

import dev.devmeet.common.*;
import dev.devmeet.profile.*;
import dev.devmeet.realtime.EventHub;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final JdbcTemplate jdbc;
  private final ProfileRepository profiles;
  private final EventHub events;
  private final MemberAccess access;

  public AdminController(
      JdbcTemplate jdbc, ProfileRepository profiles, EventHub events, MemberAccess access) {
    this.jdbc = jdbc;
    this.profiles = profiles;
    this.events = events;
    this.access = access;
  }

  public record PhotoReview(
      @NotNull @Pattern(regexp = "APPROVED|REJECTED") String status,
      @NotNull @Size(max = 500) String reason) {}

  public record ReportReview(
      @NotNull @Pattern(regexp = "VALID|DISMISSED") String status,
      @NotNull @Size(max = 1000) String note) {}

  public record Suspension(boolean suspended, @NotBlank @Size(max = 1000) String reason) {}

  @GetMapping
  @Transactional(readOnly = true)
  public Object dashboard(@RequestParam(defaultValue = "0") @Min(0) int page) {
    int offset = Math.multiplyExact(Math.min(page, 100_000), 50);
    var counts = new LinkedHashMap<String, Object>();
    for (String table :
        List.of(
            "accounts", "profiles", "recommendations", "likes", "matches", "messages", "reports"))
      counts.put(table, jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class));
    return Map.of(
        "counts",
        counts,
        "photos",
        jdbc.queryForList(
            """
            SELECT BIN_TO_UUID(account_id) id,name,photo,photo_status status FROM profiles
            WHERE photo_status='PENDING' ORDER BY account_id LIMIT 50 OFFSET ?
            """,
            offset),
        "reports",
        jdbc.queryForList(
            """
            SELECT BIN_TO_UUID(id) id,BIN_TO_UUID(sender_id) senderId,BIN_TO_UUID(target_id) targetId,
            reason,status,created_at createdAt FROM reports WHERE status='OPEN'
            ORDER BY created_at LIMIT 50 OFFSET ?
            """,
            offset),
        "pool",
        jdbc.queryForList("SELECT role,COUNT(*) count FROM profiles GROUP BY role"));
  }

  @PutMapping("/photos/{id}")
  @Transactional
  public void photo(
      Principal principal, @PathVariable UUID id, @Valid @RequestBody PhotoReview review) {
    access.lock(id);
    var p =
        profiles
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요."));
    if (review.status().equals("REJECTED") && review.reason().isBlank())
      throw new ApiException(HttpStatus.BAD_REQUEST, "반려 사유를 입력해 주세요.");
    p.reviewPhoto(review.status(), review.reason().strip());
    profiles.saveAndFlush(p);
    audit(principal, "PHOTO_" + review.status(), id, review.reason());
    events.afterCommit(id, "profile", id);
  }

  @PutMapping("/reports/{id}")
  @Transactional
  public void report(
      Principal principal, @PathVariable UUID id, @Valid @RequestBody ReportReview review) {
    int changed =
        jdbc.update(
            "UPDATE reports SET status=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP(6) WHERE"
                + " id=UUID_TO_BIN(?) AND status='OPEN'",
            review.status(),
            review.note().strip(),
            id.toString());
    if (changed == 0) throw new ApiException(HttpStatus.CONFLICT, "이미 검토했거나 없는 신고예요.");
    audit(principal, "REPORT_" + review.status(), id, review.note());
  }

  @PutMapping("/accounts/{id}")
  @Transactional
  public void suspend(
      Principal principal, @PathVariable UUID id, @Valid @RequestBody Suspension request) {
    int changed =
        jdbc.update(
            "UPDATE accounts SET suspended=? WHERE id=UUID_TO_BIN(?)",
            request.suspended(),
            id.toString());
    if (changed == 0) throw new ApiException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없어요.");
    audit(principal, request.suspended() ? "SUSPEND" : "UNSUSPEND", id, request.reason());
    events.afterCommit(id, "profile", id);
  }

  private void audit(Principal p, String action, UUID id, String note) {
    jdbc.update(
        "INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,?,UUID_TO_BIN(?),?)",
        p.getName(),
        action,
        id.toString(),
        note.strip());
  }
}
