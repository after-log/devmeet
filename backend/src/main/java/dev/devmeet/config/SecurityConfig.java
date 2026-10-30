package dev.devmeet.config;

import dev.devmeet.account.AccountRepository;
import dev.devmeet.account.OAuthClients;
import dev.devmeet.account.SocialUserService;
import jakarta.servlet.DispatcherType;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.HttpSessionCsrfTokenRepository;

@Configuration
public class SecurityConfig {
  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(12);
  }

  @Bean
  UserDetailsService userDetailsService(AccountRepository accounts, AdminPolicy admins) {
    return email ->
        accounts
            .findByEmail(email.strip().toLowerCase(Locale.ROOT))
            .map(
                account ->
                    User.withUsername(account.getEmail())
                        .password(account.getPasswordHash())
                        .disabled(account.isSuspended())
                        .roles(
                            admins.isAdmin(account.getEmail())
                                ? new String[] {"MEMBER", "ADMIN"}
                                : new String[] {"MEMBER"})
                        .build())
            .orElseThrow(() -> new UsernameNotFoundException("계정을 찾을 수 없어요."));
  }

  @Bean
  AuthenticationManager authenticationManager(UserDetailsService users, PasswordEncoder encoder) {
    var provider = new DaoAuthenticationProvider(users);
    provider.setPasswordEncoder(encoder);
    return new ProviderManager(provider);
  }

  @Bean
  SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  HttpSessionCsrfTokenRepository csrfTokenRepository() {
    return new HttpSessionCsrfTokenRepository();
  }

  @Bean
  SessionAuthenticationStrategy sessionAuthenticationStrategy(HttpSessionCsrfTokenRepository csrf) {
    return new CompositeSessionAuthenticationStrategy(
        List.of(new ChangeSessionIdAuthenticationStrategy(), new CsrfAuthenticationStrategy(csrf)));
  }

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      SecurityContextRepository contexts,
      HttpSessionCsrfTokenRepository csrf,
      OAuthClients clients,
      SocialUserService social,
      @Value("${app.public-url}") String publicUrl,
      AccountRepository accounts) {
    return http.securityContext(context -> context.securityContextRepository(contexts))
        .csrf(config -> config.csrfTokenRepository(csrf))
        .addFilterBefore(
            new SuspensionFilter(accounts),
            org.springframework.security.web.access.intercept.AuthorizationFilter.class)
        .addFilterBefore(
            new AuthRateLimitFilter(),
            org.springframework.security.web.access.intercept.AuthorizationFilter.class)
        .authorizeHttpRequests(
            auth ->
                auth.dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR)
                    .permitAll()
                    .requestMatchers("/api/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/oauth2/**", "/login/oauth2/**", "/api/auth/providers")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/auth/capabilities")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.POST,
                        "/api/auth/password/request",
                        "/api/auth/password/reset",
                        "/api/auth/email/verify")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.GET,
                        "/api/me",
                        "/api/csrf",
                        "/api/value-questions",
                        "/actuator/health",
                        "/actuator/health/**")
                    .permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/register", "/api/login")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .requestCache(cache -> cache.disable())
        .oauth2Login(
            oauth ->
                oauth
                    .clientRegistrationRepository(clients)
                    .userInfoEndpoint(info -> info.userService(social))
                    .successHandler(
                        (request, response, authentication) -> {
                          csrf.saveToken(null, request, response);
                          response.sendRedirect(publicUrl + "/?oauth=success");
                        })
                    .failureHandler(
                        (request, response, error) ->
                            response.sendRedirect(publicUrl + "/auth/login?oauth=error")))
        .exceptionHandling(
            errors ->
                errors
                    .authenticationEntryPoint(
                        (request, response, exception) -> {
                          response.setStatus(401);
                          response.setContentType("application/json;charset=UTF-8");
                          response.getWriter().write("{\"message\":\"로그인이 필요해요.\"}");
                        })
                    .accessDeniedHandler(
                        (request, response, exception) -> {
                          response.setStatus(403);
                          response.setContentType("application/json;charset=UTF-8");
                          response
                              .getWriter()
                              .write("{\"message\":\"접근 권한 또는 CSRF 토큰을 확인해 주세요.\"}");
                        }))
        .logout(
            logout ->
                logout
                    .logoutUrl("/api/logout")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("DEVMEET_SESSION")
                    .logoutSuccessHandler(
                        (request, response, authentication) -> response.setStatus(204)))
        .build();
  }
}
