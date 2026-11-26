package dev.devmeet.admin;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("local & !prod")
@ConditionalOnProperty(name = "app.mock-members.enabled", havingValue = "true")
class LocalMockMembers {
  @Bean
  ApplicationRunner initializeMockMembers(
      MockMemberService members, @Value("${app.mock-members.password:}") String password) {
    return args -> {
      var result = members.seed("local-startup", password);
      LoggerFactory.getLogger(LocalMockMembers.class).info(
          "Mock members: {} created, {} skipped, {} failed",
          result.created(), result.skipped(), result.failed());
    };
  }
}
