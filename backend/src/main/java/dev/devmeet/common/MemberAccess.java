package dev.devmeet.common;

import dev.devmeet.account.*;
import dev.devmeet.profile.*;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class MemberAccess {
  private final AccountRepository accounts;
  private final ProfileRepository profiles;
  private final JdbcTemplate jdbc;
  private final jakarta.persistence.EntityManager entityManager;

  public MemberAccess(
      AccountRepository accounts,
      ProfileRepository profiles,
      JdbcTemplate jdbc,
      jakarta.persistence.EntityManager entityManager) {
    this.accounts = accounts;
    this.profiles = profiles;
    this.jdbc = jdbc;
    this.entityManager = entityManager;
  }

  public Account account(String email) {
    return active(
        accounts
            .findByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요.")));
  }

  public Account active(Account account) {
    if (account.isSuspended()) throw new ApiException(HttpStatus.FORBIDDEN, "이용이 제한된 계정이에요.");
    return account;
  }

  public Profile profile(UUID id) {
    return profiles
        .findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "프로필을 먼저 완성해 주세요."));
  }

  public void lock(UUID id) {
    var account =
        accounts
            .lockById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "회원을 찾을 수 없어요."));
    entityManager.refresh(account, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
    active(account);
  }

  /** Both members always lock in binary UUID order, including simultaneous mutual likes. */
  public void lockPair(UUID me, UUID other) {
    if (me.equals(other)) throw new ApiException(HttpStatus.BAD_REQUEST, "자신에게는 사용할 수 없어요.");
    List.of(me, other).stream()
        .sorted(java.util.Comparator.comparing(UUID::toString))
        .forEach(this::lock);
  }

  public boolean blocked(UUID first, UUID second) {
    return jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM blocks WHERE
            (sender_id=UUID_TO_BIN(?) AND target_id=UUID_TO_BIN(?)) OR
            (sender_id=UUID_TO_BIN(?) AND target_id=UUID_TO_BIN(?))
            """,
            Integer.class,
            first.toString(),
            second.toString(),
            second.toString(),
            first.toString())
        > 0;
  }

  public void visible(UUID me, UUID other) {
    var account =
        accounts
            .findById(other)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요."));
    if (account.isSuspended() || blocked(me, other))
      throw new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요.");
  }
}
