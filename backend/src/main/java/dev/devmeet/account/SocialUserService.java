package dev.devmeet.account;

import dev.devmeet.config.AdminPolicy;
import jakarta.servlet.http.HttpServletRequest;
import java.io.Serializable;
import java.time.Instant;
import java.util.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.userinfo.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.core.user.*;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.*;

@Component
public class SocialUserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
  public static final String LINK_ATTRIBUTE = "devmeet.oauth-link";

  public record PendingLink(String email, String provider, Instant expires)
      implements Serializable {}

  private final SocialAccounts accounts;
  private final AdminPolicy admins;

  public SocialUserService(SocialAccounts accounts, AdminPolicy admins) {
    this.accounts = accounts;
    this.admins = admins;
  }

  @Override
  public OAuth2User loadUser(OAuth2UserRequest request) {
    var external = new DefaultOAuth2UserService().loadUser(request);
    String provider = request.getClientRegistration().getRegistrationId();
    String subject = String.valueOf(external.getAttributes().get("id"));
    HttpServletRequest servlet =
        ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    var session = servlet.getSession(false);
    var pending = session == null ? null : (PendingLink) session.getAttribute(LINK_ATTRIBUTE);
    String linkEmail = null;
    if (pending != null) {
      session.removeAttribute(LINK_ATTRIBUTE);
      var auth = SecurityContextHolder.getContext().getAuthentication();
      if (!pending.provider().equals(provider)
          || pending.expires().isBefore(Instant.now())
          || auth == null
          || !pending.email().equals(auth.getName()))
        throw new OAuth2AuthenticationException(new OAuth2Error("invalid_link_state"));
      linkEmail = pending.email();
    }
    try {
      var account = accounts.resolve(provider, subject, linkEmail);
      var roles = new ArrayList<SimpleGrantedAuthority>();
      roles.add(new SimpleGrantedAuthority("ROLE_MEMBER"));
      if (admins.isAdmin(account.getEmail())) roles.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
      return new DefaultOAuth2User(
          roles, Map.of("email", account.getEmail(), "id", account.getId().toString()), "email");
    } catch (RuntimeException error) {
      throw new OAuth2AuthenticationException(
          new OAuth2Error("account_link_failed"), "소셜 계정을 연결할 수 없어요.");
    }
  }
}
