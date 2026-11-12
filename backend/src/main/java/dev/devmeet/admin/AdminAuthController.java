package dev.devmeet.admin;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
  private final AdminAuthentication authentication;

  public AdminAuthController(AdminAuthentication authentication) {
    this.authentication = authentication;
  }

  public record Login(@NotBlank @Size(max=100) String id, @NotBlank @Size(max=72) String password) {
    @Override public String toString() { return "AdminLogin[id="+id+", password=REDACTED]"; }
  }

  @GetMapping("/csrf")
  public Object csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @GetMapping("/me")
  public Object me(Authentication auth) {
    boolean authenticated = auth != null && auth.getAuthorities().stream()
        .anyMatch(role -> role.getAuthority().equals("ROLE_OPERATOR"));
    return Map.of("authenticated", authenticated, "username", authenticated ? auth.getName() : "");
  }

  @PostMapping("/login")
  public Object login(@Valid @RequestBody Login input, HttpServletRequest request, HttpServletResponse response) {
    var auth = authentication.authenticate(input.id(), input.password());
    AdminSecurityConfig.sessions().onAuthentication(auth, request, response);
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    SecurityContextHolder.setContext(context);
    AdminSecurityConfig.contexts().saveContext(context, request, response);
    return Map.of("authenticated", true, "username", auth.getName());
  }

  @PostMapping("/logout")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void logout(HttpServletRequest request, HttpServletResponse response) {
    AdminSecurityConfig.contexts().saveContext(SecurityContextHolder.createEmptyContext(), request, response);
    AdminSecurityConfig.csrf().saveToken(null, request, response);
    SecurityContextHolder.clearContext();
  }
}
