package dev.devmeet.matching;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.devmeet.profile.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;

class MatchingPresetsTest {
  private MatchingPresets.Preset preset(int values,int meeting,int contact,boolean legacy) {
    return new MatchingPresets.Preset("id","series",1,"test","",values,meeting,contact,legacy,Instant.EPOCH,null);
  }
  private Profile profile(String meeting,String contact,Map<String,ValueAnswer> answers) {
    var view=mock(ProfileRequest.class);
    when(view.meeting()).thenReturn(meeting);
    when(view.contact()).thenReturn(contact);
    var profile=mock(Profile.class);
    when(profile.view()).thenReturn(view);
    when(profile.getValueAnswers()).thenReturn(answers);
    return profile;
  }
  private ValueAnswer answer(String choice) { return new ValueAnswer(choice,true); }

  @Test
  void priorityChangesCandidateOrderWithoutChangingCandidates() {
    var me=profile("a","a",Map.of("q",answer("yes")));
    var values=profile("b","b",Map.of("q",answer("yes")));
    var communication=profile("a","a",Map.of("q",answer("no")));
    var questions=Set.of("q");
    assertThat(MatchingPresets.score(me,values,questions,preset(70,15,15,false)))
        .isGreaterThan(MatchingPresets.score(me,communication,questions,preset(70,15,15,false)));
    assertThat(MatchingPresets.score(me,values,questions,preset(20,40,40,false)))
        .isLessThan(MatchingPresets.score(me,communication,questions,preset(20,40,40,false)));
  }

  @Test
  void normalizingPreventsQuestionCountFromChangingCategoryWeight() {
    var me=profile("a","a",Map.of("q1",answer("yes"),"q2",answer("yes")));
    var other=profile("b","b",me.getValueAnswers());
    assertThat(MatchingPresets.score(me,other,Set.of("q1"),preset(70,15,15,false))).isEqualTo(70);
    assertThat(MatchingPresets.score(me,other,Set.of("q1","q2"),preset(70,15,15,false))).isEqualTo(70);
  }

  @Test
  void skippedAnswersAndInactiveQuestionsNeverAddPoints() {
    var me=profile("a","a",Map.of("q1",answer("yes"),"inactive",answer("yes")));
    var other=profile("b","b",Map.of("q1",answer("yes"),"q2",answer(null),"inactive",answer("yes")));
    assertThat(MatchingPresets.score(me,other,Set.of("q1","q2"),preset(70,15,15,false))).isEqualTo(35);
    assertThat(MatchingPresets.score(me,other,Set.of(),preset(70,15,15,false))).isZero();
  }

  @Test
  void legacyPresetPreservesExistingScoring() {
    var me=profile("a","a",Map.of("q1",answer("yes"),"q2",answer("yes")));
    var other=profile("a","a",me.getValueAnswers());
    assertThat(MatchingPresets.score(me,other,Set.of("q1","q2"),preset(1,20,20,true))).isEqualTo(42);
  }
}
