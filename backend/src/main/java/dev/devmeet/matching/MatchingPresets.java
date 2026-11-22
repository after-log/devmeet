package dev.devmeet.matching;

import dev.devmeet.common.ApiException;
import dev.devmeet.profile.Profile;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class MatchingPresets {
  private final JdbcTemplate jdbc;
  public MatchingPresets(JdbcTemplate jdbc) { this.jdbc = jdbc; }

  public record Preset(String id, String seriesId, int version, String name, String description,
      int valuesWeight, int meetingWeight, int contactWeight, boolean legacyScoring, Instant createdAt, Instant deletedAt) {}

  public Preset active() {
    return jdbc.query("""
        SELECT p.* FROM matching_presets p JOIN matching_settings s ON s.active_preset_id=p.id WHERE s.id=1
        """, (rs, i) -> read(rs)).getFirst();
  }

  public Preset get(String id) {
    var rows = jdbc.query("SELECT * FROM matching_presets WHERE id=UUID_TO_BIN(?) AND deleted_at IS NULL", (rs,i) -> read(rs), id);
    if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND,"프리셋을 찾을 수 없어요.");
    return rows.getFirst();
  }

  public List<Preset> list() {
    return jdbc.query("SELECT * FROM matching_presets ORDER BY created_at DESC,name,version DESC", (rs,i) -> read(rs));
  }

  private Preset read(java.sql.ResultSet rs) throws java.sql.SQLException {
    return new Preset(uuid(rs.getBytes("id")), uuid(rs.getBytes("series_id")), rs.getInt("version"),
        rs.getString("name"),rs.getString("description"),rs.getInt("values_weight"),rs.getInt("meeting_weight"),
        rs.getInt("contact_weight"),rs.getBoolean("legacy_scoring"),rs.getTimestamp("created_at").toInstant(),
        rs.getTimestamp("deleted_at") == null ? null : rs.getTimestamp("deleted_at").toInstant());
  }

  private String uuid(byte[] bytes) {
    var buffer = java.nio.ByteBuffer.wrap(bytes);
    return new UUID(buffer.getLong(),buffer.getLong()).toString();
  }

  public static double score(Profile me, Profile other, Set<String> questions, Preset preset) {
    long equal = questions.stream().filter(id -> {
      var a = me.getValueAnswers().get(id);
      var b = other.getValueAnswers().get(id);
      return a != null && b != null && a.choice() != null && a.choice().equals(b.choice());
    }).count();
    double values = preset.legacyScoring() ? equal
        : questions.isEmpty() ? 0 : (double) equal / questions.size() * preset.valuesWeight();
    return values
        + (me.view().meeting().equals(other.view().meeting()) ? preset.meetingWeight() : 0)
        + (me.view().contact().equals(other.view().contact()) ? preset.contactWeight() : 0);
  }
}
