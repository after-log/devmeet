package dev.devmeet.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/mock-members")
public class MockMemberController {
  private final MockMemberService members;

  public MockMemberController(MockMemberService members) {
    this.members = members;
  }

  public record Request(@Size(max = 72) String password) {
    @Override
    public String toString() {
      return "MockMemberRequest[password=REDACTED]";
    }
  }

  @PostMapping
  public MockMemberService.Result seed(Principal principal, @Valid @RequestBody Request input) {
    return members.seed(principal.getName(), input.password());
  }
}
