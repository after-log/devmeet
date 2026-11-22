package dev.devmeet;

import static org.assertj.core.api.Assertions.*;

import dev.devmeet.admin.AdminMatchingController;
import dev.devmeet.common.ApiException;
import org.springframework.http.HttpStatus;
import dev.devmeet.matching.MatchingPresets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/** Uses the same dedicated TEST_DB_* database as the other integration tests. */
@SpringBootTest
@ActiveProfiles("integration")
@Transactional
class MatchingPresetIntegrationTest {
  @Autowired AdminMatchingController controller;
  @Autowired MatchingPresets presets;
  @Autowired JdbcTemplate jdbc;

  @Test
  void savingVersionsDoesNotActivateThemAndApplyingDoesNotRewriteExistingRecommendations() {
    var actor=(java.security.Principal) () -> "integration-operator";
    String previous=presets.active().id();
    Long batches=jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_batches",Long.class);
    var first=(MatchingPresets.Preset)controller.create(actor,new AdminMatchingController.Create(
        null,"test-"+UUID.randomUUID(),"initial",40,30,30));
    var second=(MatchingPresets.Preset)controller.create(actor,new AdminMatchingController.Create(
        UUID.fromString(first.id()),first.name(),"changed",70,15,15));
    assertThat(second.seriesId()).isEqualTo(first.seriesId());
    assertThat(second.version()).isEqualTo(2);
    assertThat(presets.get(first.id()).valuesWeight()).isEqualTo(40);
    assertThat(presets.active().id()).isEqualTo(previous);
    controller.activate(actor,new AdminMatchingController.Activation(UUID.fromString(second.id())));
    assertThat(presets.active().id()).isEqualTo(second.id());
    controller.activate(actor,new AdminMatchingController.Activation(UUID.fromString(first.id())));
    assertThat(presets.active().id()).isEqualTo(first.id());
    assertThatThrownBy(() -> controller.delete(actor,UUID.fromString(first.id())))
        .isInstanceOfSatisfying(ApiException.class,error -> assertThat(error.status()).isEqualTo(HttpStatus.CONFLICT));
    controller.delete(actor,UUID.fromString(second.id()));
    assertThat(presets.list()).anyMatch(p -> p.id().equals(second.id()) && p.deletedAt()!=null);
    assertThatThrownBy(() -> presets.get(second.id())).isInstanceOf(ApiException.class);
    assertThatThrownBy(() -> controller.activate(actor,new AdminMatchingController.Activation(UUID.fromString(second.id()))))
        .isInstanceOf(ApiException.class);
    var third=(MatchingPresets.Preset)controller.create(actor,new AdminMatchingController.Create(
        UUID.fromString(first.id()),first.name(),"after deletion",20,40,40));
    assertThat(third.version()).isEqualTo(3);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_batches",Long.class)).isEqualTo(batches);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_batches WHERE preset_id=UUID_TO_BIN(?)",Long.class,first.id())).isZero();
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM recommendation_batches WHERE preset_id=UUID_TO_BIN(?)",Long.class,second.id())).isZero();
  }
}
