package dev.devmeet.admin;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.web.server.ResponseStatusException;

class AdminStatisticsControllerTest {
  @Test
  void fillsEmptyDaysUsesKoreanMidnightAndCountsDistinctParticipants() throws Exception {
    var jdbc = mock(JdbcTemplate.class);
    when(jdbc.queryForObject(anyString(), eq(Long.class), any(Timestamp.class))).thenReturn(10L);
    when(jdbc.queryForObject(anyString(), eq(Long.class), any(Timestamp.class), any(Timestamp.class)))
        .thenReturn(2L);
    doAnswer(invocation -> {
      String sql = invocation.getArgument(0);
      Timestamp start = invocation.getArgument(2);
      Timestamp end = invocation.getArgument(3);
      var first = start.toInstant().atZone(ZoneId.of("Asia/Seoul"));
      assertThat(first.toLocalTime()).isEqualTo(java.time.LocalTime.MIDNIGHT);
      assertThat(first.toLocalDate()).isEqualTo(end.toInstant().atZone(ZoneId.of("Asia/Seoul")).toLocalDate().minusDays(6));
      assertThat(sql).contains("INTERVAL 9 HOUR", "created_at >= ? AND created_at <= ?", "GROUP BY DATE(DATE_ADD(created_at, INTERVAL 9 HOUR))");
      var rs = mock(ResultSet.class);
      when(rs.getString("activity_date")).thenReturn(first.toLocalDate().toString());
      when(rs.getLong("count")).thenReturn(sql.contains("DISTINCT") ? 2L : 3L);
      ((RowCallbackHandler) invocation.getArgument(1)).processRow(rs);
      return null;
    }).when(jdbc).query(anyString(), any(RowCallbackHandler.class), any(Timestamp.class), any(Timestamp.class));

    var statistics = new AdminStatisticsController(jdbc).statistics(7);
    assertThat(statistics.daily()).hasSize(7);
    assertThat(statistics.daily().getFirst().signups()).isEqualTo(3);
    assertThat(statistics.daily().getLast().signups()).isZero();
    assertThat(statistics.totalMembers()).isEqualTo(10);
    assertThat(statistics.chatParticipants()).isEqualTo(2);
    verify(jdbc).queryForObject(contains("COUNT(DISTINCT sender_id)"), eq(Long.class), any(Timestamp.class), any(Timestamp.class));
  }

  @Test
  void rejectsUnsupportedPeriodsBeforeQueryingDatabase() {
    var jdbc = mock(JdbcTemplate.class);
    var controller = new AdminStatisticsController(jdbc);
    assertThatThrownBy(() -> controller.statistics(365)).isInstanceOf(ResponseStatusException.class);
    verifyNoInteractions(jdbc);
  }
}
