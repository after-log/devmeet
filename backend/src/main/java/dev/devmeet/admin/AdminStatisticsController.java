package dev.devmeet.admin;

import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/statistics")
public class AdminStatisticsController {
  private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
  private final JdbcTemplate jdbc;

  public AdminStatisticsController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public record DailyStatistics(String date, long signups, long likes, long matches,
                                long messages, long chatParticipants) {}
  public record Statistics(Instant updatedAt, long totalMembers, long chatParticipants,
                           List<DailyStatistics> daily) {}

  @GetMapping
  @Transactional(readOnly = true)
  public Statistics statistics(@RequestParam(defaultValue = "30") int days) {
    if (days != 7 && days != 30) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.BAD_REQUEST, "조회 기간은 7일 또는 30일이어야 합니다.");
    }
    Instant now = Instant.now();
    LocalDate today = now.atZone(SEOUL).toLocalDate();
    LocalDate firstDay = today.minusDays(days - 1L);
    Timestamp start = Timestamp.from(firstDay.atStartOfDay(SEOUL).toInstant());
    Timestamp end = Timestamp.from(now);
    var signups = dailyCounts("accounts", start, end, "COUNT(*)");
    var likes = dailyCounts("likes", start, end, "COUNT(*)");
    var matches = dailyCounts("matches", start, end, "COUNT(*)");
    var messages = dailyCounts("messages", start, end, "COUNT(*)");
    var participants = dailyCounts("messages", start, end, "COUNT(DISTINCT sender_id)");
    var daily = new ArrayList<DailyStatistics>();
    for (LocalDate day = firstDay; !day.isAfter(today); day = day.plusDays(1)) {
      String date = day.toString();
      daily.add(new DailyStatistics(date, signups.getOrDefault(date, 0L),
          likes.getOrDefault(date, 0L), matches.getOrDefault(date, 0L),
          messages.getOrDefault(date, 0L), participants.getOrDefault(date, 0L)));
    }
    long total = jdbc.queryForObject("SELECT COUNT(*) FROM accounts WHERE created_at <= ?", Long.class, end);
    long chatParticipants = jdbc.queryForObject(
        "SELECT COUNT(DISTINCT sender_id) FROM messages WHERE created_at >= ? AND created_at <= ?",
        Long.class, start, end);
    return new Statistics(now, total, chatParticipants, daily);
  }

  // Table and aggregate expressions are constants supplied only by this controller.
  private Map<String, Long> dailyCounts(String table, Timestamp start, Timestamp end, String aggregate) {
    var result = new HashMap<String, Long>();
    jdbc.query("SELECT DATE(DATE_ADD(created_at, INTERVAL 9 HOUR)) activity_date, " + aggregate
        + " count FROM " + table + " WHERE created_at >= ? AND created_at <= ? GROUP BY DATE(DATE_ADD(created_at, INTERVAL 9 HOUR))",
        rs -> { result.put(rs.getString("activity_date"), rs.getLong("count")); }, start, end);
    return result;
  }
}
