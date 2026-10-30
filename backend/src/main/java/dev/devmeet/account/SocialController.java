package dev.devmeet.account;

import dev.devmeet.common.*;
import jakarta.servlet.http.HttpServletRequest;
import java.security.Principal;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class SocialController {
  private final OAuthClients clients;
  private final MemberAccess access;

  public SocialController(OAuthClients clients, MemberAccess access) {
    this.clients = clients;
    this.access = access;
  }

  @GetMapping("/providers")
  public Object providers() {
    return clients.available();
  }

  @PostMapping("/{provider}/link")
  public Object link(
      Principal principal, @PathVariable String provider, HttpServletRequest request) {
    access.account(principal.getName());
    if (clients.findByRegistrationId(provider) == null)
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "현재 이 로그인 서비스를 사용할 수 없어요.");
    request
        .getSession()
        .setAttribute(
            SocialUserService.LINK_ATTRIBUTE,
            new SocialUserService.PendingLink(
                principal.getName(), provider, Instant.now().plusSeconds(300)));
    return Map.of("url", "/oauth2/authorization/" + provider);
  }
}
