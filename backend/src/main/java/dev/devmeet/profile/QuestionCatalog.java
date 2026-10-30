package dev.devmeet.profile;

import dev.devmeet.common.ApiException;
import java.io.IOException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public class QuestionCatalog {
  public static final int PUBLIC_LIMIT = 10;
  private final List<Section> sections;
  private final Map<String, Question> questions;

  public record Section(
      String id,
      String label,
      String english,
      String icon,
      String description,
      List<Question> questions) {}

  public record Question(String id, String text, String purpose, List<String> options) {}

  public QuestionCatalog(JsonMapper mapper) throws IOException {
    try (var stream = new ClassPathResource("catalog/value-questions.json").getInputStream()) {
      sections = List.of(mapper.readValue(stream, Section[].class));
    }
    questions =
        sections.stream()
            .flatMap(section -> section.questions().stream())
            .collect(Collectors.toUnmodifiableMap(Question::id, Function.identity()));
  }

  public List<Section> sections() {
    return sections;
  }

  public Map<String, ValueAnswer> validate(Map<String, ValueAnswer> input) {
    Map<String, ValueAnswer> result = new LinkedHashMap<>();
    if (input == null) return result;
    input.forEach(
        (id, answer) -> {
          var question = questions.get(id);
          if (question == null
              || answer == null
              || (answer.choice() != null && !question.options().contains(answer.choice()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "가치관 문항과 선택지를 확인해 주세요.");
          }
          result.put(
              id,
              new ValueAnswer(
                  answer.choice(),
                  answer.choice() == null || !Boolean.FALSE.equals(answer.hidden())));
        });
    if (result.values().stream().filter(ValueAnswer::isPublic).count() > PUBLIC_LIMIT) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "프로필에는 가치관 답변을 최대 10개까지 공개할 수 있어요.");
    }
    return Collections.unmodifiableMap(result);
  }
}
