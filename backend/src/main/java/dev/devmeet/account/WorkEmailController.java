package dev.devmeet.account;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/work-email")
public class WorkEmailController {
  private final WorkEmailService service;
  private final CompanyEmailService companies;

  public WorkEmailController(WorkEmailService service, CompanyEmailService companies) {
    this.service = service;
    this.companies = companies;
  }

  public record EmailRequest(
      @NotBlank @Size(max = 100) String company, @NotBlank @Email @Size(max = 254) String email) {}

  public record CodeRequest(@NotBlank @Pattern(regexp = "[0-9]{6}") String code) {}

  public record CompanyReviewRequest(@NotBlank @Size(max=100) String company,
      @NotNull @Size(max=500) String website,@NotNull @Size(max=2000) String evidence) {}

  @PostMapping("/company-review")
  public WorkEmailService.Status submitCompany(Principal principal,@Valid @RequestBody CompanyReviewRequest input) {
    companies.submit(principal.getName(),input.company(),input.website(),input.evidence());
    return service.status(principal.getName());
  }

  @GetMapping
  public WorkEmailService.Status status(Principal principal) {
    return service.status(principal.getName());
  }

  @PostMapping("/request")
  public WorkEmailService.Status request(
      Principal principal, @Valid @RequestBody EmailRequest input) {
    return service.request(principal.getName(), input.company(), input.email());
  }

  @PostMapping("/verify")
  public WorkEmailService.Status verify(
      Principal principal, @Valid @RequestBody CodeRequest input) {
    return service.verify(principal.getName(), input.code());
  }
}
