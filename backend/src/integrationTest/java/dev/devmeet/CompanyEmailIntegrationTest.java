package dev.devmeet;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import dev.devmeet.account.*;
import dev.devmeet.common.ApiException;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("integration")
@Transactional
class CompanyEmailIntegrationTest {
  @Autowired WorkEmailService emails;
  @Autowired CompanyEmailService companies;
  @Autowired RegistrationService registration;
  @Autowired JdbcTemplate jdbc;
  @MockitoBean JavaMailSender mail;
  private final java.security.Principal operator=() -> "integration-operator";
  private String member() { return registration.register(UUID.randomUUID()+"@example.test","test-only-password").getEmail(); }
  private void verifyEmail(String member,String company,String email) {
    emails.request(member,company,email);
    var messages=ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(mail,atLeastOnce()).send(messages.capture());
    String code=messages.getValue().getText().split("인증번호: ")[1].substring(0,6);
    emails.verify(member,code);
  }
  @Test
  void unlistedCompaniesAreReviewedThenTheirDomainAutomaticallyApprovesNewMembers() {
    String domain="studio-"+UUID.randomUUID()+".test";
    String first=member();
    verifyEmail(first,"Small Studio","one@"+domain);
    assertThat(emails.status(first).companyReview()).isNull();
    companies.submit(first,"Small Studio","https://"+domain,"");
    var pending=emails.status(first).companyReview();
    assertThat(pending.status()).isEqualTo("PENDING");
    companies.review(operator,UUID.fromString(pending.id()),"APPROVED","DOMAIN","Official company domain confirmed");
    assertThat(emails.status(first).companyReview().scope()).isEqualTo("DOMAIN");
    String second=member();
    verifyEmail(second,"Untrusted claimed name","two@"+domain);
    assertThat(emails.status(second).companyReview().status()).isEqualTo("APPROVED");
    assertThat(emails.status(second).companyReview().company()).isEqualTo("Small Studio");
    companies.activateDomain(operator,domain,false,"Domain reassigned");
    assertThat(emails.status(first).companyReview().status()).isEqualTo("REVOKED");
    assertThat(emails.status(second).verified()).isNotNull();
    companies.activateDomain(operator,domain,true,"Confirmed again");
    assertThat(emails.status(first).companyReview().status()).isEqualTo("REVOKED");
    companies.submit(first,"Small Studio","","");
    assertThat(emails.status(first).companyReview().status()).isEqualTo("APPROVED");
  }
  @Test
  void personalEmailSupportsAnIndividualExceptionWithoutApprovingTheMailProvider() {
    String first=member();
    verifyEmail(first,"Small Studio",UUID.randomUUID()+"@gmail.com");
    companies.submit(first,"Small Studio","","Supporting membership evidence for a small company");
    var pending=emails.status(first).companyReview();
    companies.review(operator,UUID.fromString(pending.id()),"APPROVED","MEMBER","Membership evidence confirmed");
    assertThat(emails.status(first).companyReview().scope()).isEqualTo("MEMBER");
    String approvedId=emails.status(first).companyReview().id();
    String sameEmail=emails.status(first).verified().email();
    jdbc.update("UPDATE work_email_challenges SET created_at=DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 61 SECOND) WHERE account_id=(SELECT id FROM accounts WHERE email=?)",first);
    verifyEmail(first,"Small Studio",sameEmail);
    assertThat(emails.status(first).companyReview().id()).isEqualTo(approvedId);
    assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM company_email_domains WHERE domain='gmail.com'",Integer.class)).isZero();
    String second=member();
    verifyEmail(second,"Another company",UUID.randomUUID()+"@gmail.com");
    assertThat(emails.status(second).companyReview()).isNull();
    assertThatThrownBy(() -> companies.registerDomain(operator,"Studio","gmail.com","https://example.test","test"))
        .isInstanceOf(ApiException.class);
  }
  @Test
  void emailReplacementInvalidatesThePreviousPendingReview() {
    String member=member();
    verifyEmail(member,"Studio",UUID.randomUUID()+"@studio.test");
    companies.submit(member,"Studio","https://studio.test","");
    String oldId=emails.status(member).companyReview().id();
    jdbc.update("UPDATE work_email_challenges SET created_at=DATE_SUB(CURRENT_TIMESTAMP(6),INTERVAL 61 SECOND) WHERE account_id=(SELECT id FROM accounts WHERE email=?)",member);
    verifyEmail(member,"New company",UUID.randomUUID()+"@another.test");
    assertThat(emails.status(member).companyReview()).isNull();
    assertThat(jdbc.queryForObject("SELECT status FROM company_email_reviews WHERE id=UUID_TO_BIN(?)",String.class,oldId)).isEqualTo("SUPERSEDED");
    assertThatThrownBy(() -> companies.review(operator,UUID.fromString(oldId),"APPROVED","MEMBER","old"))
        .isInstanceOf(ApiException.class);
  }
  @Test
  void ownershipIsRequiredBeforeCorporateReview() {
    String member=member();
    assertThatThrownBy(() -> companies.submit(member,"Studio","https://studio.test",""))
        .isInstanceOf(ApiException.class).hasMessageContaining("이메일 인증번호");
  }
}
