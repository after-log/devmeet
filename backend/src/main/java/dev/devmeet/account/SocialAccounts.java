package dev.devmeet.account;

import dev.devmeet.common.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SocialAccounts {
  private final AccountRepository accounts;
  private final JdbcTemplate jdbc;
  private final PasswordEncoder passwords;
  private final MemberAccess access;

  public SocialAccounts(
      AccountRepository accounts,
      JdbcTemplate jdbc,
      PasswordEncoder passwords,
      MemberAccess access) {
    this.accounts = accounts;
    this.jdbc = jdbc;
    this.passwords = passwords;
    this.access = access;
  }

  @Transactional
  public Account resolve(String provider, String subject, String linkEmail) {
    if (!Set.of("github", "kakao").contains(provider) || !subject.matches("[0-9]{1,100}"))
      throw new ApiException(HttpStatus.BAD_REQUEST, "인증 제공자 정보를 확인할 수 없어요.");
    var ids =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(account_id) FROM oauth_identities WHERE provider=? AND subject=?",
            String.class,
            provider,
            subject);
    if (linkEmail != null) {
      var account = access.account(linkEmail);
      access.lock(account.getId());
      if (!ids.isEmpty() && !ids.getFirst().equals(account.getId().toString()))
        throw new ApiException(HttpStatus.CONFLICT, "이미 다른 회원과 연결된 계정이에요.");
      var current =
          jdbc.queryForList(
              "SELECT subject FROM oauth_identities WHERE account_id=UUID_TO_BIN(?) AND provider=?",
              String.class,
              account.getId().toString(),
              provider);
      if (!current.isEmpty() && !current.getFirst().equals(subject))
        throw new ApiException(HttpStatus.CONFLICT, "이미 다른 소셜 계정을 연결했어요.");
      if (ids.isEmpty())
        jdbc.update(
            "INSERT INTO oauth_identities VALUES(?,?,UUID_TO_BIN(?))",
            provider,
            subject,
            account.getId().toString());
      return account;
    }
    if (!ids.isEmpty())
      return access.active(accounts.findById(UUID.fromString(ids.getFirst())).orElseThrow());
    // Provider email addresses are never used to silently link existing local accounts.
    var account =
        accounts.saveAndFlush(
            new Account(
                provider + "." + subject + "@oauth.devmeet.invalid",
                passwords.encode(UUID.randomUUID().toString())));
    jdbc.update(
        "INSERT INTO oauth_identities VALUES(?,?,UUID_TO_BIN(?))",
        provider,
        subject,
        account.getId().toString());
    return account;
  }
}
