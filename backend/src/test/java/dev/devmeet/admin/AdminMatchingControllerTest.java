package dev.devmeet.admin;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import dev.devmeet.common.ApiException;
import dev.devmeet.matching.MatchingPresets;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;

class AdminMatchingControllerTest {
  private MatchingPresets.Preset preset(String id) {
    return new MatchingPresets.Preset(id,id,1,"test","",40,30,30,false,Instant.EPOCH,null);
  }

  @Test
  void activePresetCannotBeDeleted() {
    var jdbc=mock(JdbcTemplate.class);
    var presets=mock(MatchingPresets.class);
    UUID id=UUID.randomUUID();
    when(presets.get(id.toString())).thenReturn(preset(id.toString()));
    when(presets.active()).thenReturn(preset(id.toString()));
    var controller=new AdminMatchingController(jdbc,presets);
    assertThatThrownBy(() -> controller.delete(() -> "operator",id))
        .isInstanceOfSatisfying(ApiException.class,error -> assertThat(error.status()).isEqualTo(HttpStatus.CONFLICT));
    verify(jdbc,never()).update(anyString(),any(Object[].class));
  }

  @Test
  void deletionArchivesOnlyTheSelectedVersionAndRecordsTheActor() {
    var jdbc=mock(JdbcTemplate.class);
    var presets=mock(MatchingPresets.class);
    UUID id=UUID.randomUUID();
    when(presets.get(id.toString())).thenReturn(preset(id.toString()));
    when(presets.active()).thenReturn(preset(UUID.randomUUID().toString()));
    new AdminMatchingController(jdbc,presets).delete(() -> "operator",id);
    verify(jdbc).update("UPDATE matching_presets SET deleted_at=CURRENT_TIMESTAMP(6) WHERE id=UUID_TO_BIN(?)",id.toString());
    verify(jdbc).update("INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,?,UUID_TO_BIN(?),?)","operator","MATCH_PRESET_DELETE",id.toString(),"test v1");
    verify(jdbc,never()).update(startsWith("DELETE"),any(Object[].class));
  }
}
