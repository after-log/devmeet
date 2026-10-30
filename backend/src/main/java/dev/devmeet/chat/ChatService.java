package dev.devmeet.chat;

import dev.devmeet.common.*;
import dev.devmeet.matching.MatchingService;
import dev.devmeet.realtime.EventHub;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ChatService {
  private final MemberAccess access;
  private final MatchingService matching;
  private final JdbcTemplate jdbc;
  private final EventHub events;

  public ChatService(
      MemberAccess access, MatchingService matching, JdbcTemplate jdbc, EventHub events) {
    this.access = access;
    this.matching = matching;
    this.jdbc = jdbc;
    this.events = events;
  }

  public record Message(String id, String sender, String text, long created) {}

  public Object messages(String email, UUID target, UUID before) {
    UUID me = access.account(email).getId();
    UUID match = matching.requireMatch(me, target);
    long sequence = Long.MAX_VALUE;
    if (before != null) {
      var rows =
          jdbc.queryForList(
              "SELECT sequence_id FROM messages WHERE id=UUID_TO_BIN(?) AND"
                  + " match_id=UUID_TO_BIN(?)",
              Long.class,
              before.toString(),
              match.toString());
      if (rows.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "잘못된 대화 커서예요.");
      sequence = rows.getFirst();
    }
    var rows =
        jdbc.query(
            """
            SELECT BIN_TO_UUID(id) id,BIN_TO_UUID(sender_id) sender,body,created_at
            FROM messages WHERE match_id=UUID_TO_BIN(?) AND sequence_id<? ORDER BY sequence_id DESC LIMIT 101
            """,
            (rs, n) ->
                new Message(
                    rs.getString("id"),
                    rs.getString("sender"),
                    rs.getString("body"),
                    rs.getTimestamp("created_at").toInstant().toEpochMilli()),
            match.toString(),
            sequence);
    boolean more = rows.size() > 100;
    var page = new ArrayList<>(rows.subList(0, Math.min(100, rows.size())));
    Collections.reverse(page);
    Map<String, Object> response = new LinkedHashMap<>();
    response.put("messages", page);
    response.put("nextCursor", more ? page.getFirst().id() : null);
    return response;
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public Object send(String email, UUID target, String input) {
    UUID me = access.account(email).getId();
    access.lockPair(me, target);
    UUID match = matching.requireMatch(me, target);
    String body = input.strip();
    if (body.isEmpty() || body.length() > 1000)
      throw new ApiException(HttpStatus.BAD_REQUEST, "메시지는 1~1000자로 입력해 주세요.");
    UUID id = UUID.randomUUID();
    jdbc.update(
        "INSERT INTO messages(id,match_id,sender_id,body)"
            + " VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?),?)",
        id.toString(),
        match.toString(),
        me.toString(),
        body);
    long created =
        jdbc.queryForObject(
                "SELECT created_at FROM messages WHERE id=UUID_TO_BIN(?)",
                java.sql.Timestamp.class,
                id.toString())
            .toInstant()
            .toEpochMilli();
    // Only a notification is emitted; message contents are read through the authorized endpoint.
    events.afterCommit(target, "message", me);
    events.afterCommit(me, "message", target);
    return Map.of("message", new Message(id.toString(), me.toString(), body, created));
  }
}
