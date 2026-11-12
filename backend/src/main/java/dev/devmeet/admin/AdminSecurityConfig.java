package dev.devmeet.admin;

import dev.devmeet.config.AuthRateLimitFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;
import java.util.List;

@Configuration
public class AdminSecurityConfig {
  public static HttpSessionSecurityContextRepository contexts() {
    var repository = new HttpSessionSecurityContextRepository();
    repository.setSpringSecurityContextKey("DEVMEET_ADMIN_CONTEXT");
    return repository;
  }

  public static HttpSessionCsrfTokenRepository csrf() {
    var repository = new HttpSessionCsrfTokenRepository();
    repository.setSessionAttributeName("DEVMEET_ADMIN_CSRF");
    return repository;
  }

  public static CompositeSessionAuthenticationStrategy sessions() {
    return new CompositeSessionAuthenticationStrategy(
        List.of(new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrf())));
  }

  @Bean
  @Order(1)
  SecurityFilterChain adminSecurityFilterChain(HttpSecurity http) {
    return http.securityMatcher("/api/admin", "/api/admin/**")
        .securityContext(context -> context.securityContextRepository(contexts()))
        .csrf(config -> config.csrfTokenRepository(csrf()))
        .addFilterBefore(new AuthRateLimitFilter(),
            org.springframework.security.web.access.intercept.AuthorizationFilter.class)
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.GET, "/api/admin/auth/csrf", "/api/admin/auth/me").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/admin/auth/login").permitAll()
            .anyRequest().hasRole("OPERATOR"))
        .requestCache(cache -> cache.disable())
        .exceptionHandling(errors -> errors
            .authenticationEntryPoint((request, response, error) -> {
              response.setStatus(401);
              response.setContentType("application/json;charset=UTF-8");
              response.getWriter().write("{\"message\":\"관리자 로그인이 필요해요.\"}");
            })
            .accessDeniedHandler((request, response, error) -> {
              response.setStatus(403);
              response.setContentType("application/json;charset=UTF-8");
              response.getWriter().write("{\"message\":\"관리자 권한 또는 CSRF 토큰을 확인해 주세요.\"}");
            }))
        .build();
  }
}
