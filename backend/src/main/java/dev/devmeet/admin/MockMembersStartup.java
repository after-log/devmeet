package dev.devmeet.admin;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
class MockMembersStartup {
  @Bean
  ApplicationRunner initializeMockMembers(
      MockMemberService members,
      MockMemberLifecycle lifecycle,
      Environment environment,
      @Value("${app.mock-members.auto-seed:false}") boolean autoSeed,
      @Value("${app.mock-members.enabled:false}") boolean localSeed,
      @Value("${app.mock-members.password:}") String password) {
    return args -> {
      if (!autoSeed && !(localSeed && environment.matchesProfiles("local & !prod"))) return;
      if (!lifecycle.enabled()) return;
      var result = members.seed("startup", password);
      LoggerFactory.getLogger(MockMembersStartup.class).info(
          "Mock members: {} created, {} skipped, {} failed",
          result.created(), result.skipped(), result.failed());
    };
  }
}
