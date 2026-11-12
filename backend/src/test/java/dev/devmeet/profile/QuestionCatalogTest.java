package dev.devmeet.profile;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.devmeet.common.ApiException;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.json.JsonMapper;

class QuestionCatalogTest {
  private QuestionCatalog catalog;
  private List<QuestionCatalog.Entry> entries;

  @BeforeEach
  void loadCatalog() throws Exception {
    var mapper=JsonMapper.builder().build();
    try(var stream=new ClassPathResource("catalog/value-questions.json").getInputStream()) {
      var sections=mapper.readValue(stream,QuestionCatalog.Section[].class);
      entries=Arrays.stream(sections).flatMap(section->section.questions().stream().map(q->new QuestionCatalog.Entry(q.id(),section.id(),section.label(),q.text(),q.purpose(),q.options(),true))).toList();
    }
    catalog=spy(new QuestionCatalog(mock(JdbcTemplate.class),mapper));
    doReturn(entries).when(catalog).entries();
  }

  @Test
  void retainsTheOriginalEightyStableIds() {
    assertThat(entries).hasSize(80);
    assertThat(entries.stream().map(QuestionCatalog.Entry::id)).doesNotHaveDuplicates();
  }

  @Test
  void rejectsUnknownQuestionsAndInvalidOptions() {
    assertThatThrownBy(()->catalog.validate(Map.of("UNKNOWN",new ValueAnswer("x",true)))).isInstanceOf(ApiException.class);
    assertThatThrownBy(()->catalog.validate(Map.of("D01",new ValueAnswer("invalid",true)))).isInstanceOf(ApiException.class);
  }

  @Test
  void defaultsToPrivateAndDoesNotPublishSkippedAnswers() {
    var result=catalog.validate(Map.of("D01",new ValueAnswer(entries.getFirst().options().getFirst(),null),"D02",new ValueAnswer(null,false)));
    assertThat(result.values()).allMatch(answer->!answer.isPublic());
  }

  @Test
  void allowsTenPublicAnswersAndRejectsEleven() {
    Map<String,ValueAnswer> answers=new LinkedHashMap<>();
    for(int i=0;i<entries.size();i++) answers.put(entries.get(i).id(),new ValueAnswer(entries.get(i).options().getFirst(),i>=10));
    assertThat(catalog.validate(answers)).hasSize(80);
    var eleventh=entries.get(10);
    answers.put(eleventh.id(),new ValueAnswer(eleventh.options().getFirst(),false));
    assertThatThrownBy(()->catalog.validate(answers)).isInstanceOf(ApiException.class).hasMessageContaining("10개");
  }

  @Test
  void inactiveAnswersSurviveAnActiveOnlySaveAndCannotBeChanged() {
    var first=entries.getFirst();
    var modified=new ArrayList<>(entries);
    modified.set(0,new QuestionCatalog.Entry(first.id(),first.sectionId(),first.section(),first.text(),first.purpose(),first.options(),false));
    doReturn(modified).when(catalog).entries();
    var previous=Map.of(first.id(),new ValueAnswer(first.options().getFirst(),false));
    var result=catalog.validate(Map.of(),previous);
    assertThat(result.get(first.id()).choice()).isEqualTo(previous.get(first.id()).choice());
    assertThat(result.get(first.id()).hidden()).isTrue();
    var attempted=catalog.validate(Map.of(first.id(),new ValueAnswer(first.options().getLast(),false)),previous);
    assertThat(attempted.get(first.id())).isEqualTo(result.get(first.id()));
  }
}
