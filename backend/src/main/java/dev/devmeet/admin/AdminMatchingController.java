package dev.devmeet.admin;

import dev.devmeet.common.ApiException;
import dev.devmeet.matching.MatchingPresets;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.sql.Timestamp;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/matching")
public class AdminMatchingController {
  private final JdbcTemplate jdbc;
  private final MatchingPresets presets;
  public AdminMatchingController(JdbcTemplate jdbc, MatchingPresets presets) {
    this.jdbc=jdbc; this.presets=presets;
  }

  public record Create(UUID baseId, @NotBlank @Size(max=60) String name,
      @NotNull @Size(max=300) String description,
      @NotNull @Min(0) @Max(100) Integer valuesWeight,
      @NotNull @Min(0) @Max(100) Integer meetingWeight,
      @NotNull @Min(0) @Max(100) Integer contactWeight) {}
  public record Activation(@NotNull UUID id) {}

  @GetMapping
  @Transactional(readOnly=true)
  public Object list() {
    Instant now=Instant.now();
    // Only cohorts whose complete seven-day outcome window has elapsed are compared.
    var performance=jdbc.queryForList("""
        SELECT BIN_TO_UUID(b.preset_id) presetId,COUNT(*) recommendations,
               COUNT(DISTINCT b.owner_id) members,
               SUM(CASE WHEN l.sender_id IS NOT NULL THEN 1 ELSE 0 END) likes,
               SUM(CASE WHEN m.id IS NOT NULL THEN 1 ELSE 0 END) matches
        FROM recommendation_batches b
        JOIN recommendations r ON r.owner_id=b.owner_id AND r.day=b.day
        LEFT JOIN likes l ON l.sender_id=r.owner_id AND l.target_id=r.target_id
             AND l.created_at>=b.generated_at AND l.created_at<DATE_ADD(b.generated_at,INTERVAL 7 DAY)
        LEFT JOIN matches m ON
             ((m.first_id=r.owner_id AND m.second_id=r.target_id)
               OR (m.first_id=r.target_id AND m.second_id=r.owner_id))
             AND m.created_at>=b.generated_at AND m.created_at<DATE_ADD(b.generated_at,INTERVAL 7 DAY)
        WHERE b.preset_id IS NOT NULL AND b.generated_at>=? AND b.generated_at<=?
        GROUP BY b.preset_id
        """,Timestamp.from(now.minus(Duration.ofDays(30))),Timestamp.from(now.minus(Duration.ofDays(7))));
    return Map.of("presets",presets.list(),"activeId",presets.active().id(),
        "updatedAt",now,"performance",performance);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public Object create(Principal actor,@Valid @RequestBody Create input) {
    if (input.valuesWeight()+input.meetingWeight()+input.contactWeight()!=100)
      throw new ApiException(HttpStatus.BAD_REQUEST,"가중치 합계는 100%여야 해요.");
    lockSettings();
    String id=UUID.randomUUID().toString();
    String series=id;
    String name=input.name().strip();
    int version=1;
    if (input.baseId()!=null) {
      var base=presets.get(input.baseId().toString());
      if (base.legacyScoring())
        throw new ApiException(HttpStatus.BAD_REQUEST,"기존 추천 방식은 보존됩니다. 새 프리셋으로 저장해 주세요.");
      series=base.seriesId();
      name=base.name();
      version=jdbc.queryForObject("SELECT MAX(version)+1 FROM matching_presets WHERE series_id=UUID_TO_BIN(?)",Integer.class,series);
    }
    jdbc.update("""
        INSERT INTO matching_presets(id,series_id,version,name,description,values_weight,meeting_weight,contact_weight)
        VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,?,?,?)
        """,id,series,version,name,input.description().strip(),input.valuesWeight(),input.meetingWeight(),input.contactWeight());
    audit(actor,"MATCH_PRESET_CREATE",id,name+" v"+version);
    return presets.get(id);
  }

  @PutMapping("/active")
  @Transactional
  public void activate(Principal actor,@Valid @RequestBody Activation input) {
    lockSettings();
    var preset=presets.get(input.id().toString());
    jdbc.update("UPDATE matching_settings SET active_preset_id=UUID_TO_BIN(?),updated_at=CURRENT_TIMESTAMP(6) WHERE id=1",preset.id());
    audit(actor,"MATCH_PRESET_ACTIVATE",preset.id(),preset.name()+" v"+preset.version());
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Transactional
  public void delete(Principal actor, @PathVariable UUID id) {
    lockSettings();
    var preset=presets.get(id.toString());
    if (presets.active().id().equals(preset.id()))
      throw new ApiException(HttpStatus.CONFLICT,"적용 중인 프리셋은 삭제할 수 없어요. 다른 프리셋을 먼저 적용해 주세요.");
    jdbc.update("UPDATE matching_presets SET deleted_at=CURRENT_TIMESTAMP(6) WHERE id=UUID_TO_BIN(?)",preset.id());
    audit(actor,"MATCH_PRESET_DELETE",preset.id(),preset.name()+" v"+preset.version());
  }

  private void lockSettings() {
    jdbc.queryForObject("SELECT id FROM matching_settings WHERE id=1 FOR UPDATE",Integer.class);
  }
  private void audit(Principal actor,String action,String id,String note) {
    jdbc.update("INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,?,UUID_TO_BIN(?),?)",actor.getName(),action,id,note);
  }
}
