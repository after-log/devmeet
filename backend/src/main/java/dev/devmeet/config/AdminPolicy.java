package dev.devmeet.config;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AdminPolicy {
  private final Set<String> emails;

  public AdminPolicy(@Value("${app.admin-emails:}") String configured) {
    emails = new HashSet<>();
    Arrays.stream(configured.split(","))
        .map(String::strip)
        .filter(s -> !s.isEmpty())
        .map(s -> s.toLowerCase(Locale.ROOT))
        .forEach(emails::add);
  }

  public boolean isAdmin(String email) {
    return emails.contains(email.toLowerCase(Locale.ROOT));
  }
}
