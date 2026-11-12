package dev.devmeet.admin;

import dev.devmeet.common.ApiException;
import dev.devmeet.profile.QuestionCatalog;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/admin/questions")
public class AdminQuestionsController {
  private final JdbcTemplate jdbc;
  private final QuestionCatalog catalog;
  private final JsonMapper json;

  public AdminQuestionsController(JdbcTemplate jdbc, QuestionCatalog catalog, JsonMapper json) {
    this.jdbc=jdbc; this.catalog=catalog; this.json=json;
  }

  public record Create(@NotBlank @Size(max=60) String section,
      @NotBlank @Size(max=200) String text,
      @NotNull @Pattern(regexp="매칭|프로필") String purpose,
      @NotNull @Size(min=4,max=4) List<@NotBlank @Size(max=100) String> options) {}
  public record Activation(@NotNull Boolean active) {}

  @GetMapping
  @Transactional(readOnly=true)
  public Object list() { return Map.of("questions",catalog.entries(),"sections",catalog.sections()); }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @Transactional
  public Object create(Principal principal, @Valid @RequestBody Create input) {
    var options=input.options().stream().map(String::strip).toList();
    if (new HashSet<>(options).size()!=4)
      throw new ApiException(HttpStatus.BAD_REQUEST,"서로 다른 선택지 4개를 입력해 주세요.");
    // Serialize ordering changes within a section without locking unrelated membership records.
    var sections=jdbc.queryForList("SELECT id FROM value_sections WHERE label=? FOR UPDATE",String.class,input.section().strip());
    if (sections.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"가치관 분류를 확인해 주세요.");
    String id="Q"+UUID.randomUUID().toString().replace("-","");
    Integer order=jdbc.queryForObject("SELECT COALESCE(MAX(sort_order),-1)+1 FROM value_questions WHERE section_id=?",Integer.class,sections.getFirst());
    jdbc.update("INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES(?,?,?,?,?,?)",id,sections.getFirst(),input.text().strip(),input.purpose(),json.writeValueAsString(options),order);
    audit(principal,"QUESTION_CREATE",id,input.text().strip());
    return Map.of("id",id);
  }

  @PutMapping("/{id}")
  @Transactional
  public void activate(Principal principal,@PathVariable @Size(max=40) String id,@Valid @RequestBody Activation input) {
    if (jdbc.update("UPDATE value_questions SET active=? WHERE id=?",input.active(),id)==0)
      throw new ApiException(HttpStatus.NOT_FOUND,"가치관 문항을 찾을 수 없어요.");
    audit(principal,input.active()?"QUESTION_ACTIVATE":"QUESTION_DEACTIVATE",id,"");
  }

  private void audit(Principal actor,String action,String questionId,String note) {
    jdbc.update("INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,?,UUID_TO_BIN(?),?)",actor.getName(),action,UUID.nameUUIDFromBytes(questionId.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString(),questionId+": "+note);
  }
}
