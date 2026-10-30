package dev.devmeet.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class RecoveryController {
  private final AccountRecovery recovery;

  public RecoveryController(AccountRecovery recovery) {
    this.recovery = recovery;
  }

  public record Email(@NotBlank @jakarta.validation.constraints.Email String email) {}

  public record Reset(
      @NotBlank String token, @NotBlank @Size(min = 10, max = 72) String password) {}

  public record Token(@NotBlank String token) {}

  @GetMapping("/capabilities")
  public Object capabilities() {
    return Map.of("email", recovery.available());
  }

  @PostMapping("/password/request")
  public Object request(@Valid @RequestBody Email input) {
    recovery.requestReset(input.email());
    return Map.of("message", "등록된 이메일이면 재설정 링크를 보냈어요.");
  }

  @PostMapping("/password/reset")
  public void reset(@Valid @RequestBody Reset input) {
    recovery.consume(input.token(), "RESET", input.password());
  }

  @PostMapping("/email/request")
  public void verify(Principal principal) {
    recovery.requestVerification(principal.getName());
  }

  @PostMapping("/email/verify")
  public void verify(@Valid @RequestBody Token input) {
    recovery.consume(input.token(), "VERIFY", null);
  }
}
