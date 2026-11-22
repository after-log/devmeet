package dev.devmeet.account;

import dev.devmeet.common.ApiException;
import java.net.IDN;
import java.net.URI;
import java.util.*;
import org.springframework.http.HttpStatus;

public final class CompanyEmailPolicy {
  private CompanyEmailPolicy() {}
  // Defensive exclusions, not proof that every other domain belongs to a business.
  private static final Set<String> SHARED = Set.of(
      "gmail.com","googlemail.com","naver.com","daum.net","hanmail.net","kakao.com",
      "nate.com","outlook.com","hotmail.com","live.com","msn.com","icloud.com","me.com",
      "mac.com","yahoo.com","yahoo.co.jp","aol.com","proton.me","protonmail.com","pm.me",
      "qq.com","163.com","126.com","mail.com","gmx.com","gmx.de","yandex.com","yandex.ru",
      "zoho.com","tuta.com","tutanota.com","fastmail.com","hey.com",
      "mailinator.com","yopmail.com","guerrillamail.com","tempmail.com","10minutemail.com");

  public static String emailDomain(String email) {
    return email.substring(email.lastIndexOf('@')+1).toLowerCase(Locale.ROOT);
  }
  public static String domain(String input) {
    try {
      String value=IDN.toASCII(input.strip(),IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
      if (value.length()>253 || !value.matches("[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+")
          || value.matches("[0-9.]+") || Arrays.stream(value.split("\\.")).anyMatch(label -> label.length()>63))
        throw new IllegalArgumentException();
      return value;
    } catch (IllegalArgumentException error) {
      throw new ApiException(HttpStatus.BAD_REQUEST,"이메일 도메인만 입력해 주세요. 예: company.com");
    }
  }
  public static boolean shared(String domain) {
    return SHARED.stream().anyMatch(value -> domain.equals(value) || domain.endsWith("."+value));
  }
  public static void allowCorporateDomain(String domain) {
    if (shared(domain)) throw new ApiException(HttpStatus.BAD_REQUEST,
        "개인·공용 메일 도메인은 기업 도메인으로 승인할 수 없어요. 회원별 승인을 사용해 주세요.");
  }
  public static String website(String input) {
    if (input==null || input.isBlank()) return "";
    try {
      URI uri=URI.create(input.strip());
      if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))
          || uri.getHost()==null || uri.getUserInfo()!=null || uri.toASCIIString().length()>500)
        throw new IllegalArgumentException();
      return uri.toASCIIString();
    } catch (IllegalArgumentException error) {
      throw new ApiException(HttpStatus.BAD_REQUEST,"홈페이지는 http 또는 https 주소로 입력해 주세요.");
    }
  }
}
