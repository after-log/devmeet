package dev.devmeet.account;

import dev.devmeet.common.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {
  private final AccountRepository accounts;
  private final PasswordEncoder passwords;

  public RegistrationService(AccountRepository accounts, PasswordEncoder passwords) {
    this.accounts = accounts;
    this.passwords = passwords;
  }

  @Transactional
  public Account register(String email, String password) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요.");
    }
    String address = email.strip().toLowerCase(Locale.ROOT);
    if (accounts.existsByEmail(address)) {
      throw new ApiException(HttpStatus.CONFLICT, "이미 가입한 이메일이에요. 로그인해 주세요.");
    }
    return accounts.saveAndFlush(new Account(address, passwords.encode(password)));
  }
}
