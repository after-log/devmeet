package dev.devmeet.profile;

import dev.devmeet.common.ApiException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;

class QuestionCatalogTest {
    private QuestionCatalog catalog;

    @BeforeEach
    void loadCatalog() throws Exception {
        catalog = new QuestionCatalog(JsonMapper.builder().build());
    }

    @Test
    void loadsEightyUniqueQuestions() {
        assertThat(catalog.sections()).hasSize(5);
        assertThat(catalog.sections().stream().mapToInt(section -> section.questions().size()).sum())
            .isEqualTo(80);
    }

    @Test
    void rejectsUnknownQuestionsAndInvalidOptions() {
        assertThatThrownBy(() -> catalog.validate(Map.of("UNKNOWN", new ValueAnswer("x", true))))
            .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> catalog.validate(Map.of("D01", new ValueAnswer("invalid", true))))
            .isInstanceOf(ApiException.class);
    }

    @Test
    void defaultsToPrivateAndDoesNotPublishSkippedAnswers() {
        var choice = catalog.sections().getFirst().questions().getFirst().options().getFirst();
        var result = catalog.validate(Map.of("D01", new ValueAnswer(choice, null),
            "D02", new ValueAnswer(null, false)));
        assertThat(result.values()).allMatch(answer -> !answer.isPublic());
        assertThat(result.get("D01").hidden()).isTrue();
        assertThat(result.get("D02").hidden()).isTrue();
    }

    @Test
    void allowsTenPublicAnswersAndRejectsElevenWithoutDroppingPrivateAnswers() {
        Map<String, ValueAnswer> answers = new LinkedHashMap<>();
        var questions = catalog.sections().stream().flatMap(section -> section.questions().stream()).toList();
        for (int i = 0; i < questions.size(); i++) {
            var question = questions.get(i);
            answers.put(question.id(), new ValueAnswer(question.options().getFirst(), i >= 10));
        }
        var result = catalog.validate(answers);
        assertThat(result).hasSize(80);
        assertThat(result.values().stream().filter(ValueAnswer::isPublic).count()).isEqualTo(10);
        var eleventh = questions.get(10);
        answers.put(eleventh.id(), new ValueAnswer(eleventh.options().getFirst(), false));
        assertThatThrownBy(() -> catalog.validate(answers)).isInstanceOf(ApiException.class)
            .hasMessageContaining("10개");
    }
}
