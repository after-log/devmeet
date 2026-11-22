package dev.devmeet.account;

import static org.assertj.core.api.Assertions.*;
import dev.devmeet.common.ApiException;
import org.junit.jupiter.api.Test;

class CompanyEmailPolicyTest {
  @Test
  void normalizesOnlyAnExactDomainAndRejectsUrlsWildcardsAndAddresses() {
    assertThat(CompanyEmailPolicy.domain(" Example.COM ")).isEqualTo("example.com");
    assertThat(CompanyEmailPolicy.domain("mail.example.com")).isEqualTo("mail.example.com");
    for (String invalid : new String[]{"https://example.com","*@example.com","*.example.com","user@example.com","localhost","127.0.0.1","example.com/path","example.com:443","-bad.example","a..com"})
      assertThatThrownBy(() -> CompanyEmailPolicy.domain(invalid)).isInstanceOf(ApiException.class);
  }
  @Test
  void sharedAndTemporaryMailCannotApproveAnEntireDomain() {
    for (String shared : new String[]{"gmail.com","naver.com","outlook.com","mail.gmail.com","mailinator.com"}) {
      assertThat(CompanyEmailPolicy.shared(shared)).isTrue();
      assertThatThrownBy(() -> CompanyEmailPolicy.allowCorporateDomain(shared)).isInstanceOf(ApiException.class);
    }
    assertThat(CompanyEmailPolicy.shared("gmail.com.example.com")).isFalse();
    assertThat(CompanyEmailPolicy.shared("small-studio.example")).isFalse();
  }
  @Test
  void websiteAcceptsOnlyClickableHttpUrlsWithoutEmbeddedCredentials() {
    assertThat(CompanyEmailPolicy.website(" https://example.com/about ")).isEqualTo("https://example.com/about");
    assertThat(CompanyEmailPolicy.website("")).isEmpty();
    for (String invalid : new String[]{"javascript:alert(1)","file:///etc/passwd","https://user:pass@example.com","//example.com","example.com"})
      assertThatThrownBy(() -> CompanyEmailPolicy.website(invalid)).isInstanceOf(ApiException.class);
  }
}
