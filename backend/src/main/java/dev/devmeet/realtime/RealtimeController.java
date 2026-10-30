package dev.devmeet.realtime;

import dev.devmeet.common.MemberAccess;
import java.security.Principal;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@EnableScheduling
public class RealtimeController {
  private final EventHub events;
  private final MemberAccess access;

  public RealtimeController(EventHub events, MemberAccess access) {
    this.events = events;
    this.access = access;
  }

  @GetMapping(value = "/api/events", produces = "text/event-stream")
  public SseEmitter events(Principal principal) {
    return events.subscribe(access.account(principal.getName()).getId());
  }
}
