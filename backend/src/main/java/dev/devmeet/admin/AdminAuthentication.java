package dev.devmeet.admin;

import dev.devmeet.common.ApiException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/** Separate operator credentials; membership and OAuth never grant this authority. */
@Component
public class AdminAuthentication {
  private final String username;
  private final String passwordHash;
  private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
  private final String dummyHash = encoder.encode("unconfigured-admin-credential");

  public AdminAuthentication(
      @Value("${app.admin.username:}") String username,
      @Value("${app.admin.password-hash:}") String passwordHash) {
    this.username = username;
    this.passwordHash = passwordHash;
  }

  public Authentication authenticate(String id, String password) {
    if (username.isBlank() || passwordHash.isBlank())
      throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "관리자 계정이 설정되지 않았어요. 서버 설정을 확인해 주세요.");
    boolean valid = password.getBytes(StandardCharsets.UTF_8).length <= 72;
    boolean matches = encoder.matches(valid ? password : "", id.equals(username) ? passwordHash : dummyHash);
    if (!valid || !id.equals(username) || !matches)
      throw new ApiException(HttpStatus.UNAUTHORIZED,"관리자 아이디 또는 비밀번호가 맞지 않아요.");
    return UsernamePasswordAuthenticationToken.authenticated(
        username, null, List.of(new SimpleGrantedAuthority("ROLE_OPERATOR")));
  }
}
