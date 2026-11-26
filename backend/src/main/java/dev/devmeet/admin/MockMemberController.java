package dev.devmeet.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/mock-members")
public class MockMemberController {
  private final MockMemberService members;
  private final MockMemberLifecycle lifecycle;

  public MockMemberController(MockMemberService members, MockMemberLifecycle lifecycle) {
    this.members = members;
    this.lifecycle = lifecycle;
  }

  public record Request(@Size(max = 72) String password) {
    @Override
    public String toString() {
      return "MockMemberRequest[password=REDACTED]";
    }
  }

  public record Setting(@jakarta.validation.constraints.NotNull Boolean enabled) {}

  @GetMapping
  public MockMemberLifecycle.Status status() {
    return lifecycle.status();
  }

  @PutMapping("/enabled")
  public MockMemberLifecycle.Status setEnabled(Principal principal, @Valid @RequestBody Setting input) {
    return lifecycle.setEnabled(principal.getName(), input.enabled());
  }

  @DeleteMapping
  public MockMemberLifecycle.Deletion purge(Principal principal) {
    return lifecycle.purge(principal.getName());
  }

  @PostMapping
  public MockMemberService.Result seed(Principal principal, @Valid @RequestBody Request input) {
    return members.seed(principal.getName(), input.password());
  }
}
