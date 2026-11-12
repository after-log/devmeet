package dev.devmeet.profile;

import dev.devmeet.common.ApiException;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Component
@Transactional(readOnly=true)
public class QuestionCatalog {
  public static final int PUBLIC_LIMIT = 10;
  private final JdbcTemplate jdbc;
  private final JsonMapper json;

  public record Section(String id, String label, String english, String icon, String description, List<Question> questions) {}
  public record Question(String id, String text, String purpose, List<String> options) {}
  public record Entry(String id, String sectionId, String section, String text, String purpose, List<String> options, boolean active) {
    public Question question() { return new Question(id,text,purpose,options); }
  }

  public QuestionCatalog(JdbcTemplate jdbc, JsonMapper json) {
    this.jdbc = jdbc;
    this.json = json;
  }

  public List<Entry> entries() {
    return jdbc.query("""
        SELECT q.id,q.section_id,s.label,q.text,q.purpose,q.options,q.active
        FROM value_questions q JOIN value_sections s ON s.id=q.section_id
        ORDER BY s.sort_order,q.sort_order,q.id
        """, (rs,index) -> new Entry(rs.getString("id"),rs.getString("section_id"),rs.getString("label"),
            rs.getString("text"),rs.getString("purpose"),List.of(json.readValue(rs.getString("options"),String[].class)),rs.getBoolean("active")));
  }

  public List<Section> sections() {
    var entries = entries();
    return jdbc.query("SELECT * FROM value_sections ORDER BY sort_order,id", (rs,index) -> {
        String sectionId = rs.getString("id");
        return new Section(rs.getString("id"),rs.getString("label"),rs.getString("english"),rs.getString("icon"),rs.getString("description"),
            entries.stream().filter(e -> e.active() && e.sectionId().equals(sectionId)).map(Entry::question).toList()); });
  }

  public Set<String> matchingIds() {
    return new HashSet<>(jdbc.queryForList("SELECT id FROM value_questions WHERE active=true AND purpose='매칭'",String.class));
  }

  public Map<String,ValueAnswer> validate(Map<String,ValueAnswer> input, Map<String,ValueAnswer> previous) {
    var result = new LinkedHashMap<>(validate(input));
    for (var entry : entries()) {
      if (entry.active()) continue;
      result.remove(entry.id());
      var old = previous.get(entry.id());
      if (old != null) result.put(entry.id(),new ValueAnswer(old.choice(),true));
    }
    return Collections.unmodifiableMap(result);
  }

  public Map<String,ValueAnswer> publicAnswers(Map<String,ValueAnswer> answers) {
    var active = new HashSet<>(jdbc.queryForList("SELECT id FROM value_questions WHERE active=true",String.class));
    var visible = new LinkedHashMap<String,ValueAnswer>();
    answers.forEach((id,answer) -> { if (active.contains(id) && answer.isPublic() && visible.size() < PUBLIC_LIMIT) visible.put(id,answer); });
    return visible;
  }

  /** Preserve inactive answers, but make them private and never use them for matching. */
  public Map<String, ValueAnswer> validate(Map<String, ValueAnswer> input) {
    var definitions = new HashMap<String,Entry>();
    entries().forEach(entry -> definitions.put(entry.id(),entry));
    Map<String,ValueAnswer> result = new LinkedHashMap<>();
    if (input == null) return result;
    input.forEach((id, answer) -> {
      var entry = definitions.get(id);
      if (entry == null || answer == null || (answer.choice()!=null && !entry.options().contains(answer.choice())))
        throw new ApiException(HttpStatus.BAD_REQUEST,"가치관 문항과 선택지를 확인해 주세요.");
      result.put(id,new ValueAnswer(answer.choice(),!entry.active() || answer.choice()==null || !Boolean.FALSE.equals(answer.hidden())));
    });
    if (result.values().stream().filter(ValueAnswer::isPublic).count() > PUBLIC_LIMIT)
      throw new ApiException(HttpStatus.BAD_REQUEST,"프로필에는 가치관 답변을 최대 10개까지 공개할 수 있어요.");
    return Collections.unmodifiableMap(result);
  }
}
