package dev.devmeet.account;

import dev.devmeet.common.ApiException;
import dev.devmeet.profile.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.Collections;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class AuthController {
  private final RegistrationService registration;
  private final AuthenticationManager authentication;
  private final SessionAuthenticationStrategy sessions;
  private final SecurityContextRepository contexts;
  private final ProfileService profiles;

  public AuthController(
      RegistrationService registration,
      AuthenticationManager authentication,
      SessionAuthenticationStrategy sessions,
      SecurityContextRepository contexts,
      ProfileService profiles) {
    this.registration = registration;
    this.authentication = authentication;
    this.sessions = sessions;
    this.contexts = contexts;
    this.profiles = profiles;
  }

  public record Registration(
      @NotBlank @Email @Size(max = 254) String email,
      @NotBlank @Size(min = 10, max = 72) String password) {}

  public record Login(
      @NotBlank @Email @Size(max = 254) String email, @NotBlank @Size(max = 72) String password) {}

  @GetMapping("/csrf")
  public Object csrf(CsrfToken token) {
    return Map.of("token", token.getToken(), "headerName", token.getHeaderName());
  }

  @GetMapping("/me")
  public Object me(Principal principal) {
    return Collections.singletonMap(
        "user", principal == null ? null : profiles.me(principal.getName()));
  }

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  public Object register(
      @Valid @RequestBody Registration input,
      HttpServletRequest request,
      HttpServletResponse response) {
    registration.register(input.email(), input.password());
    return signIn(input.email(), input.password(), request, response);
  }

  @PostMapping("/login")
  public Object login(
      @Valid @RequestBody Login input, HttpServletRequest request, HttpServletResponse response) {
    return signIn(input.email(), input.password(), request, response);
  }

  private Object signIn(
      String email, String password, HttpServletRequest request, HttpServletResponse response) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.");
    }
    var authenticated =
        authentication.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(email, password));
    sessions.onAuthentication(authenticated, request, response);
    var context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authenticated);
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    return Map.of("user", profiles.me(authenticated.getName()));
  }
}
