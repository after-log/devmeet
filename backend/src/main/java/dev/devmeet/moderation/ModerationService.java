package dev.devmeet.moderation;

import dev.devmeet.common.*;
import dev.devmeet.profile.ProfileRepository;
import dev.devmeet.realtime.EventHub;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ModerationService {
  private final MemberAccess access;
  private final JdbcTemplate jdbc;
  private final ProfileRepository profiles;
  private final EventHub events;

  public ModerationService(
      MemberAccess access, JdbcTemplate jdbc, ProfileRepository profiles, EventHub events) {
    this.access = access;
    this.jdbc = jdbc;
    this.profiles = profiles;
    this.events = events;
  }

  @Transactional
  public Object report(String email, UUID target, String reason) {
    UUID me = access.account(email).getId();
    access.lockPair(me, target);
    access.profile(target);
    UUID id = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO reports(id,sender_id,target_id,reason)"
            + " VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?)",
        id.toString(),
        me.toString(),
        target.toString(),
        reason.strip());
    return Map.of("id", id.toString());
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public void block(String email, UUID target, boolean remove) {
    UUID me = access.account(email).getId();
    access.lockPair(me, target);
    if (remove)
      jdbc.update(
          "DELETE FROM blocks WHERE sender_id=UUID_TO_BIN(?) AND target_id=UUID_TO_BIN(?)",
          me.toString(),
          target.toString());
    else
      jdbc.update(
          "INSERT IGNORE INTO blocks(sender_id,target_id) VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?))",
          me.toString(),
          target.toString());
    events.afterCommit(me, "connections", target);
    events.afterCommit(target, "connections", me);
  }

  public Object blocks(String email) {
    UUID me = access.account(email).getId();
    var ids =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(target_id) FROM blocks WHERE sender_id=UUID_TO_BIN(?)",
            String.class,
            me.toString());
    var people =
        ids.stream()
            .map(UUID::fromString)
            .map(profiles::findById)
            .flatMap(Optional::stream)
            .map(p -> p.publicView())
            .toList();
    return Map.of("people", people);
  }
}
