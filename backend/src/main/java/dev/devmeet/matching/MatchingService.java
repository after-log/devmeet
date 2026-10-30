package dev.devmeet.matching;

import dev.devmeet.common.*;
import dev.devmeet.profile.*;
import dev.devmeet.realtime.EventHub;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MatchingService {
  private final MemberAccess access;
  private final ProfileRepository profiles;
  private final JdbcTemplate jdbc;
  private final EventHub events;
  private final Set<String> matchingQuestions;
  private final boolean requireGithub;

  public MatchingService(
      MemberAccess access,
      ProfileRepository profiles,
      JdbcTemplate jdbc,
      EventHub events,
      QuestionCatalog catalog,
      @Value("${app.require-github:false}") boolean requireGithub) {
    this.access = access;
    this.profiles = profiles;
    this.jdbc = jdbc;
    this.events = events;
    this.requireGithub = requireGithub;
    matchingQuestions = new HashSet<>();
    catalog
        .sections()
        .forEach(
            section ->
                section.questions().stream()
                    .filter(q -> q.purpose().equals("매칭"))
                    .forEach(q -> matchingQuestions.add(q.id())));
  }

  public static LocalDate today() {
    return LocalDate.now(ZoneId.of("Asia/Seoul"));
  }

  public static String first(UUID a, UUID b) {
    return a.toString().compareTo(b.toString()) < 0 ? a.toString() : b.toString();
  }

  public static String second(UUID a, UUID b) {
    return a.toString().compareTo(b.toString()) < 0 ? b.toString() : a.toString();
  }

  public boolean github(UUID id) {
    return jdbc.queryForObject(
            "SELECT COUNT(*) FROM oauth_identities WHERE account_id=UUID_TO_BIN(?) AND"
                + " provider='github'",
            Integer.class,
            id.toString())
        > 0;
  }

  private boolean eligible(Profile profile) {
    return profile.getPhotoStatus().equals("APPROVED")
        && (!requireGithub
            || !profile.view().role().equals("developer")
            || github(profile.getAccountId()));
  }

  private boolean wants(ProfileRequest me, ProfileRequest candidate) {
    return candidate.age() >= me.minAge()
        && candidate.age() <= me.maxAge()
        && (me.region().isEmpty() || candidate.location().contains(me.region()))
        && (!me.role().equals("non-developer") || candidate.role().equals("developer"))
        && (!me.preference().equals("개발자") || candidate.role().equals("developer"))
        && (!me.preference().equals("비개발자") || candidate.role().equals("non-developer"));
  }

  private int score(Profile me, Profile other) {
    var a = me.view();
    var b = other.view();
    int score =
        (a.meeting().equals(b.meeting()) ? 20 : 0) + (a.contact().equals(b.contact()) ? 20 : 0);
    for (String id : matchingQuestions) {
      var mine = me.getValueAnswers().get(id);
      var theirs = other.getValueAnswers().get(id);
      if (mine != null
          && theirs != null
          && mine.choice() != null
          && mine.choice().equals(theirs.choice())) score++;
    }
    return score;
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public Object recommendations(String email) {
    UUID me = access.account(email).getId();
    access.lock(me);
    Profile mine = access.profile(me);
    String day = today().toString();
    List<String> liked =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(target_id) FROM likes WHERE sender_id=UUID_TO_BIN(?) AND day=?",
            String.class,
            me.toString(),
            day);
    if (!eligible(mine))
      return Map.of(
          "people",
          List.of(),
          "liked",
          liked,
          "remaining",
          Math.max(0, 3 - liked.size()),
          "day",
          day,
          "notice",
          mine.getPhotoStatus().equals("APPROVED")
              ? "GitHub 계정을 연결해 주세요."
              : "사진 검수가 끝나면 추천을 받을 수 있어요.");
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM recommendation_batches WHERE owner_id=UUID_TO_BIN(?) AND day=?",
            Integer.class,
            me.toString(),
            day)
        == 0) {
      jdbc.update(
          "INSERT INTO recommendation_batches(owner_id,day) VALUES(UUID_TO_BIN(?),?)",
          me.toString(),
          day);
      var candidates =
          jdbc
              .queryForList(
                  """
                  SELECT BIN_TO_UUID(p.account_id) FROM profiles p JOIN accounts a ON a.id=p.account_id
                  WHERE p.account_id<>UUID_TO_BIN(?) AND a.suspended=false AND p.photo_status='APPROVED'
                  AND p.age BETWEEN ? AND ? ORDER BY a.created_at DESC LIMIT 500
                  """,
                  String.class,
                  me.toString(),
                  mine.view().minAge(),
                  mine.view().maxAge())
              .stream()
              .map(UUID::fromString)
              .filter(id -> !access.blocked(me, id))
              .filter(
                  id ->
                      jdbc.queryForObject(
                              "SELECT COUNT(*) FROM likes WHERE sender_id=UUID_TO_BIN(?) AND"
                                  + " target_id=UUID_TO_BIN(?)",
                              Integer.class,
                              me.toString(),
                              id.toString())
                          == 0)
              .map(id -> access.profile(id))
              .filter(this::eligible)
              .filter(p -> wants(mine.view(), p.view()) && wants(p.view(), mine.view()))
              .sorted(
                  Comparator.<Profile>comparingInt(p -> score(mine, p))
                      .reversed()
                      .thenComparing(
                          p ->
                              UUID.nameUUIDFromBytes(
                                  (day + p.getAccountId())
                                      .getBytes(java.nio.charset.StandardCharsets.UTF_8))))
              .limit(3)
              .toList();
      for (int i = 0; i < candidates.size(); i++)
        jdbc.update(
            "INSERT INTO recommendations VALUES(UUID_TO_BIN(?),?,?,UUID_TO_BIN(?))",
            me.toString(),
            day,
            i,
            candidates.get(i).getAccountId().toString());
    }
    var ids =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(target_id) FROM recommendations WHERE owner_id=UUID_TO_BIN(?) AND"
                + " day=? ORDER BY position",
            String.class,
            me.toString(),
            day);
    return Map.of(
        "people",
        people(me, ids),
        "liked",
        liked,
        "remaining",
        Math.max(0, 3 - liked.size()),
        "day",
        day);
  }

  @Transactional(isolation = org.springframework.transaction.annotation.Isolation.READ_COMMITTED)
  public Object like(String email, UUID target) {
    UUID me = access.account(email).getId();
    access.lockPair(me, target);
    Profile mine = access.profile(me);
    Profile other = access.profile(target);
    if (!eligible(mine) || !eligible(other) || access.blocked(me, target))
      throw new ApiException(HttpStatus.FORBIDDEN, "좋아요를 보낼 수 없는 상대예요.");
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM likes WHERE sender_id=UUID_TO_BIN(?) AND"
                + " target_id=UUID_TO_BIN(?)",
            Integer.class,
            me.toString(),
            target.toString())
        > 0) return Map.of("matched", matchId(me, target) != null);
    String day = today().toString();
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM recommendations WHERE owner_id=UUID_TO_BIN(?) AND"
                + " target_id=UUID_TO_BIN(?) AND day=?",
            Integer.class,
            me.toString(),
            target.toString(),
            day)
        == 0) throw new ApiException(HttpStatus.FORBIDDEN, "오늘 추천된 사람에게만 좋아요를 보낼 수 있어요.");
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM likes WHERE sender_id=UUID_TO_BIN(?) AND day=?",
            Integer.class,
            me.toString(),
            day)
        >= 3) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "오늘의 좋아요를 모두 사용했어요.");
    jdbc.update(
        "INSERT INTO likes(sender_id,target_id,day) VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),?)",
        me.toString(),
        target.toString(),
        day);
    boolean mutual =
        jdbc.queryForObject(
                "SELECT COUNT(*) FROM likes WHERE sender_id=UUID_TO_BIN(?) AND"
                    + " target_id=UUID_TO_BIN(?)",
                Integer.class,
                target.toString(),
                me.toString())
            > 0;
    if (mutual && matchId(me, target) == null)
      jdbc.update(
          "INSERT INTO matches(id,first_id,second_id)"
              + " VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?),UUID_TO_BIN(?))",
          UUID.randomUUID().toString(),
          first(me, target),
          second(me, target));
    events.afterCommit(target, mutual ? "match" : "like", me);
    if (mutual) events.afterCommit(me, "match", target);
    return Map.of("matched", mutual);
  }

  public UUID matchId(UUID a, UUID b) {
    var matches =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(id) FROM matches WHERE first_id=UUID_TO_BIN(?) AND"
                + " second_id=UUID_TO_BIN(?)",
            String.class,
            first(a, b),
            second(a, b));
    return matches.isEmpty() ? null : UUID.fromString(matches.getFirst());
  }

  public UUID requireMatch(UUID me, UUID target) {
    access.visible(me, target);
    UUID match = matchId(me, target);
    if (match == null) throw new ApiException(HttpStatus.FORBIDDEN, "서로 좋아요를 보낸 상대와만 대화할 수 있어요.");
    return match;
  }

  public Object connections(String email) {
    UUID me = access.account(email).getId();
    access.profile(me);
    var sent =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(target_id) FROM likes WHERE sender_id=UUID_TO_BIN(?) ORDER BY"
                + " created_at DESC",
            String.class,
            me.toString());
    var received =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(sender_id) FROM likes WHERE target_id=UUID_TO_BIN(?) ORDER BY"
                + " created_at DESC",
            String.class,
            me.toString());
    var matches =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(IF(first_id=UUID_TO_BIN(?),second_id,first_id)) FROM matches WHERE"
                + " first_id=UUID_TO_BIN(?) OR second_id=UUID_TO_BIN(?) ORDER BY created_at DESC",
            String.class,
            me.toString(),
            me.toString(),
            me.toString());
    return Map.of(
        "sent", people(me, sent), "received", people(me, received), "matches", people(me, matches));
  }

  public List<Map<String, Object>> people(UUID me, List<String> ids) {
    var result = new ArrayList<Map<String, Object>>();
    for (String id : ids) {
      UUID target = UUID.fromString(id);
      if (access.blocked(me, target)) continue;
      try {
        access.visible(me, target);
        var p = access.profile(target);
        if (eligible(p)) {
          var view = p.publicView();
          view.put("githubVerified", github(target));
          result.add(view);
        }
      } catch (ApiException ignored) {
        /* Deleted/suspended/incomplete profiles never leak. */
      }
    }
    return result;
  }
}
