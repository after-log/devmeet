package dev.devmeet.matching;

import dev.devmeet.chat.ChatService;
import dev.devmeet.moderation.ModerationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.security.Principal;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class CommunityController {
  private final MatchingService matching;
  private final ChatService chats;
  private final ModerationService moderation;

  public CommunityController(
      MatchingService matching, ChatService chats, ModerationService moderation) {
    this.matching = matching;
    this.chats = chats;
    this.moderation = moderation;
  }

  public record Target(@NotNull UUID id) {}

  public record Report(@NotNull UUID id, @NotBlank @Size(max = 500) String reason) {}

  public record Text(@NotBlank @Size(max = 1000) String text) {}

  @GetMapping("/recommendations")
  public Object recommendations(Principal p) {
    return matching.recommendations(p.getName());
  }

  @PostMapping("/likes")
  public Object like(Principal p, @Valid @RequestBody Target target) {
    return matching.like(p.getName(), target.id());
  }

  @GetMapping("/connections")
  public Object connections(Principal p) {
    return matching.connections(p.getName());
  }

  @GetMapping("/messages/{id}")
  public Object messages(
      Principal p, @PathVariable UUID id, @RequestParam(required = false) UUID before) {
    return chats.messages(p.getName(), id, before);
  }

  @PostMapping("/messages/{id}")
  public Object send(Principal p, @PathVariable UUID id, @Valid @RequestBody Text text) {
    return chats.send(p.getName(), id, text.text());
  }

  @PostMapping("/report")
  public Object report(Principal p, @Valid @RequestBody Report report) {
    return moderation.report(p.getName(), report.id(), report.reason());
  }

  @PostMapping("/block")
  public void block(Principal p, @Valid @RequestBody Target target) {
    moderation.block(p.getName(), target.id(), false);
  }

  @DeleteMapping("/blocks/{id}")
  public void unblock(Principal p, @PathVariable UUID id) {
    moderation.block(p.getName(), id, true);
  }

  @GetMapping("/blocks")
  public Object blocks(Principal p) {
    return moderation.blocks(p.getName());
  }
}
