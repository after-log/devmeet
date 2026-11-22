package dev.devmeet.account;

import dev.devmeet.common.*;
import java.security.Principal;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompanyEmailService {
  private final JdbcTemplate jdbc;
  private final MemberAccess access;
  public CompanyEmailService(JdbcTemplate jdbc,MemberAccess access) { this.jdbc=jdbc; this.access=access; }
  public record Review(String id,String company,String email,String domain,String website,String evidence,
      String status,String scope,String note,Instant submittedAt,Instant reviewedAt) {}

  @Transactional(readOnly=true)
  public Review current(String accountId) {
    var rows=jdbc.query("""
        SELECT r.* FROM company_email_reviews r JOIN work_email_verifications v
        ON v.company_review_id=r.id AND v.account_id=r.account_id AND v.email=r.email
        WHERE v.account_id=UUID_TO_BIN(?)
        """,(rs,i) -> new Review(uuid(rs.getBytes("id")),rs.getString("company"),rs.getString("email"),
        rs.getString("domain"),rs.getString("website"),rs.getString("evidence"),rs.getString("status"),
        rs.getString("approval_scope"),rs.getString("review_note"),rs.getTimestamp("created_at").toInstant(),
        rs.getTimestamp("reviewed_at")==null?null:rs.getTimestamp("reviewed_at").toInstant()),accountId);
    return rows.isEmpty()?null:rows.getFirst();
  }
  public void lockRegistry() {
    jdbc.queryForObject("SELECT id FROM company_email_registry_lock WHERE id=1 FOR UPDATE",Integer.class);
  }
  private List<Map<String,Object>> approvedDomain(String domain) {
    return jdbc.queryForList("SELECT * FROM company_email_domains WHERE domain=? AND active=true",domain);
  }
  // Caller holds the account lock, then registry lock, before replacing the ownership confirmation.
  public void onEmailVerified(String accountId,String email) {
    Review previous=current(accountId);
    if (previous!=null && (previous.status().equals("PENDING") || previous.status().equals("APPROVED"))) return;
    jdbc.update("UPDATE company_email_reviews SET status='SUPERSEDED' WHERE account_id=UUID_TO_BIN(?) AND status='PENDING'",accountId);
    var domains=approvedDomain(CompanyEmailPolicy.emailDomain(email));
    if (!domains.isEmpty()) {
      var entry=domains.getFirst();
      create(accountId,email,entry.get("company").toString(),entry.get("website").toString(),"",true);
    }
  }

  @Transactional
  public void submit(String principal,String company,String website,String evidence) {
    String accountId=access.account(principal).getId().toString();
    access.lock(UUID.fromString(accountId));
    lockRegistry();
    var verified=jdbc.queryForList("SELECT email FROM work_email_verifications WHERE account_id=UUID_TO_BIN(?)",accountId);
    if (verified.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"먼저 이메일 인증번호를 확인해 주세요.");
    Review previous=current(accountId);
    if (previous!=null && (previous.status().equals("PENDING") || previous.status().equals("APPROVED")))
      throw new ApiException(HttpStatus.CONFLICT,"이미 검토 중이거나 승인된 인증 요청이 있어요.");
    String email=verified.getFirst().get("email").toString();
    var domains=approvedDomain(CompanyEmailPolicy.emailDomain(email));
    if (!domains.isEmpty()) {
      var entry=domains.getFirst();
      create(accountId,email,entry.get("company").toString(),entry.get("website").toString(),"",true);
      return;
    }
    website=CompanyEmailPolicy.website(website);
    if (company.isBlank() || (website.isEmpty() && evidence.strip().length()<20))
      throw new ApiException(HttpStatus.BAD_REQUEST,"회사명과 공식 홈페이지 또는 소속 확인 자료·설명(20자 이상)을 입력해 주세요.");
    if (jdbc.queryForObject("SELECT COUNT(*) FROM company_email_reviews WHERE account_id=UUID_TO_BIN(?) AND created_at>DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 1 DAY)",Integer.class,accountId)>=3)
      throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,"기업 인증 검토는 하루 3회까지 요청할 수 있어요.");
    create(accountId,email,company.strip(),website,evidence.strip(),false);
  }
  private void create(String accountId,String email,String company,String website,String evidence,boolean approved) {
    String id=UUID.randomUUID().toString();
    jdbc.update("""
        INSERT INTO company_email_reviews(id,account_id,email,company,domain,website,evidence,status,approval_scope,review_note,reviewed_by,reviewed_at)
        VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),?,?,?,?,?,?,?, ?,?,IF(?,CURRENT_TIMESTAMP(6),NULL))
        """,id,accountId,email,company,CompanyEmailPolicy.emailDomain(email),website,evidence,
        approved?"APPROVED":"PENDING",approved?"DOMAIN":null,approved?"승인된 기업 도메인으로 자동 인증":"",approved?"SYSTEM":null,approved);
    jdbc.update("UPDATE work_email_verifications SET company_review_id=UUID_TO_BIN(?) WHERE account_id=UUID_TO_BIN(?)",id,accountId);
  }

  @Transactional
  public void review(Principal actor,UUID requestId,String decision,String scope,String note) {
    var owners=jdbc.queryForList("SELECT BIN_TO_UUID(account_id) FROM company_email_reviews WHERE id=UUID_TO_BIN(?)",String.class,requestId.toString());
    if (owners.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND,"인증 요청을 찾을 수 없어요.");
    String accountId=owners.getFirst();
    jdbc.queryForObject("SELECT BIN_TO_UUID(id) FROM accounts WHERE id=UUID_TO_BIN(?) FOR UPDATE",String.class,accountId);
    lockRegistry();
    var rows=jdbc.queryForList("""
        SELECT r.* FROM company_email_reviews r JOIN work_email_verifications v
        ON v.company_review_id=r.id AND v.account_id=r.account_id AND v.email=r.email
        WHERE r.id=UUID_TO_BIN(?) AND r.status='PENDING' FOR UPDATE
        """,requestId.toString());
    if (rows.isEmpty()) throw new ApiException(HttpStatus.CONFLICT,"이미 처리됐거나 회원의 인증 이메일이 변경된 요청이에요.");
    var row=rows.getFirst();
    if (decision.equals("APPROVED") && scope.equals("DOMAIN")) {
      registerDomain(actor,row.get("company").toString(),row.get("domain").toString(),row.get("website").toString(),note);
    } else {
      jdbc.update("UPDATE company_email_reviews SET status=?,approval_scope=?,review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP(6) WHERE id=UUID_TO_BIN(?)",
          decision,decision.equals("APPROVED")?"MEMBER":null,note.strip(),actor.getName(),requestId.toString());
    }
    audit(actor,"COMPANY_REVIEW_"+decision,requestId.toString(),note.strip());
  }

  @Transactional
  public void registerDomain(Principal actor,String company,String inputDomain,String website,String note) {
    lockRegistry();
    String domain=CompanyEmailPolicy.domain(inputDomain);
    CompanyEmailPolicy.allowCorporateDomain(domain);
    website=CompanyEmailPolicy.website(website);
    if (website.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST,"도메인 전체 승인에는 공식 홈페이지가 필요해요.");
    var existing=jdbc.queryForList("SELECT company FROM company_email_domains WHERE domain=?",domain);
    if (!existing.isEmpty() && !existing.getFirst().get("company").equals(company.strip()))
      throw new ApiException(HttpStatus.CONFLICT,"이미 다른 회사명으로 등록된 도메인이에요.");
    jdbc.update("""
        INSERT INTO company_email_domains(domain,company,website,note,reviewed_by) VALUES(?,?,?,?,?)
        ON DUPLICATE KEY UPDATE active=true,website=VALUES(website),note=VALUES(note),reviewed_by=VALUES(reviewed_by),updated_at=CURRENT_TIMESTAMP(6)
        """,domain,company.strip(),website,note.strip(),actor.getName());
    // Only requests still attached to the member's current ownership confirmation are approved.
    jdbc.update("""
        UPDATE company_email_reviews r JOIN work_email_verifications v
        ON v.company_review_id=r.id AND v.account_id=r.account_id AND v.email=r.email
        SET r.status='APPROVED',r.company=?,r.website=?,r.approval_scope='DOMAIN',r.review_note=?,r.reviewed_by=?,r.reviewed_at=CURRENT_TIMESTAMP(6)
        WHERE r.domain=? AND r.status='PENDING'
        """,company.strip(),website,note.strip(),actor.getName(),domain);
    audit(actor,"COMPANY_DOMAIN_APPROVE",domainId(domain),domain+": "+note.strip());
  }
  @Transactional
  public void activateDomain(Principal actor,String inputDomain,boolean active,String note) {
    lockRegistry();
    String domain=CompanyEmailPolicy.domain(inputDomain);
    if (jdbc.update("UPDATE company_email_domains SET active=?,note=?,reviewed_by=?,updated_at=CURRENT_TIMESTAMP(6) WHERE domain=?",active,note.strip(),actor.getName(),domain)==0)
      throw new ApiException(HttpStatus.NOT_FOUND,"등록된 기업 도메인을 찾을 수 없어요.");
    if (!active) jdbc.update("UPDATE company_email_reviews SET status='REVOKED',review_note=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP(6) WHERE domain=? AND approval_scope='DOMAIN' AND status='APPROVED'",note.strip(),actor.getName(),domain);
    audit(actor,active?"COMPANY_DOMAIN_ENABLE":"COMPANY_DOMAIN_DISABLE",domainId(domain),domain+": "+note.strip());
  }
  private String domainId(String domain) { return UUID.nameUUIDFromBytes(domain.getBytes(java.nio.charset.StandardCharsets.UTF_8)).toString(); }
  private void audit(Principal actor,String action,String id,String note) {
    jdbc.update("INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,?,UUID_TO_BIN(?),?)",actor.getName(),action,id,note.substring(0,note.offsetByCodePoints(0,Math.min(1000,note.codePointCount(0,note.length())))));
  }
  private String uuid(byte[] data) { var bytes=java.nio.ByteBuffer.wrap(data); return new UUID(bytes.getLong(),bytes.getLong()).toString(); }
}
