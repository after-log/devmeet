package dev.devmeet.profile;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.security.Principal;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class ProfileController {
    private final ProfileService profiles;
    private final QuestionCatalog catalog;

    public ProfileController(ProfileService profiles, QuestionCatalog catalog) {
        this.profiles = profiles;
        this.catalog = catalog;
    }

    public record ValuesRequest(@NotNull @Size(max = 80) Map<String, ValueAnswer> valueAnswers) {}

    @GetMapping("/value-questions")
    public Object questions() {
        return Map.of("sections", catalog.sections(), "publicLimit", QuestionCatalog.PUBLIC_LIMIT);
    }

    @PutMapping("/profile")
    public Object save(Principal principal, @Valid @RequestBody ProfileRequest request) {
        return Map.of("profile", profiles.save(principal.getName(), request));
    }

    @PutMapping("/profile/values")
    public Object saveValues(Principal principal, @Valid @RequestBody ValuesRequest request) {
        return Map.of("profile", profiles.saveValues(principal.getName(), request.valueAnswers()));
    }

    @GetMapping("/people/{id}")
    public Object publicProfile(@PathVariable UUID id) {
        return Map.of("person", profiles.publicProfile(id));
    }
}
