package dev.devmeet.admin;

import dev.devmeet.account.CompanyEmailService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/company-email")
public class AdminCompanyEmailController {
  private final CompanyEmailService companies;
  private final JdbcTemplate jdbc;
  public AdminCompanyEmailController(CompanyEmailService companies,JdbcTemplate jdbc) { this.companies=companies;this.jdbc=jdbc; }
  public record Decision(@NotNull @Pattern(regexp="APPROVED|REJECTED") String status,
      @NotNull @Pattern(regexp="MEMBER|DOMAIN") String scope,@NotBlank @Size(max=1000) String note) {}
  public record Domain(@NotBlank @Size(max=100) String company,@NotBlank @Size(max=253) String domain,
      @NotBlank @Size(max=500) String website,@NotBlank @Size(max=1000) String note) {}
  public record Activation(@NotNull Boolean active,@NotBlank @Size(max=1000) String note) {}

  @GetMapping
  @Transactional(readOnly=true)
  public Object list() {
    var requests=jdbc.query("""
        SELECT r.*,BIN_TO_UUID(r.id) request_id,BIN_TO_UUID(r.account_id) member_id,
               COALESCE(p.name,a.email) member_name,a.email login_email,
               v.verified_at,(v.company_review_id=r.id AND v.email=r.email) current_request
        FROM company_email_reviews r JOIN accounts a ON a.id=r.account_id
        LEFT JOIN profiles p ON p.account_id=r.account_id
        LEFT JOIN work_email_verifications v ON v.account_id=r.account_id
        ORDER BY (r.status='PENDING' AND v.company_review_id=r.id AND v.email=r.email) DESC,r.created_at DESC,r.id LIMIT 500
        """,(rs,i) -> {
      var row=new LinkedHashMap<String,Object>();
      row.put("id",rs.getString("request_id")); row.put("memberId",rs.getString("member_id"));
      row.put("memberName",rs.getString("member_name"));row.put("loginEmail",rs.getString("login_email"));
      for (String key:List.of("company","email","domain","website","evidence","status")) row.put(key,rs.getString(key));
      row.put("sharedDomain",dev.devmeet.account.CompanyEmailPolicy.shared(rs.getString("domain")));
      row.put("scope",rs.getString("approval_scope"));row.put("note",rs.getString("review_note"));
      row.put("current",rs.getBoolean("current_request"));row.put("createdAt",rs.getTimestamp("created_at").toInstant());
      row.put("emailVerifiedAt",rs.getBoolean("current_request")?rs.getTimestamp("verified_at").toInstant():null);
      row.put("reviewedAt",rs.getTimestamp("reviewed_at")==null?null:rs.getTimestamp("reviewed_at").toInstant());
      return row;
    });
    var domains=jdbc.query("SELECT * FROM company_email_domains ORDER BY active DESC,company,domain",(rs,i) -> Map.of(
        "domain",rs.getString("domain"),"company",rs.getString("company"),"website",rs.getString("website"),
        "active",rs.getBoolean("active"),"note",rs.getString("note"),"updatedAt",rs.getTimestamp("updated_at").toInstant()));
    return Map.of("requests",requests,"domains",domains);
  }
  @PutMapping("/requests/{id}")
  public void review(Principal actor,@PathVariable UUID id,@Valid @RequestBody Decision input) {
    companies.review(actor,id,input.status(),input.scope(),input.note());
  }
  @PostMapping("/domains")
  public void createDomain(Principal actor,@Valid @RequestBody Domain input) {
    companies.registerDomain(actor,input.company(),input.domain(),input.website(),input.note());
  }
  @PutMapping("/domains/{domain}")
  public void activate(Principal actor,@PathVariable String domain,@Valid @RequestBody Activation input) {
    companies.activateDomain(actor,domain,input.active(),input.note());
  }
}
