package dev.devmeet.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.web.filter.OncePerRequestFilter;

/** Limits password hashing and account-recovery requests before they reach controllers. */
public class AuthRateLimitFilter extends OncePerRequestFilter {
  private record Window(long minute, AtomicInteger count) {}

  private final ConcurrentHashMap<String, Window> attempts = new ConcurrentHashMap<>();
  private final Set<String> paths =
      Set.of(
          "/api/login",
          "/api/register",
          "/api/auth/password/request",
          "/api/auth/password/reset",
          "/api/auth/email/request");

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    if (request.getMethod().equals("POST") && paths.contains(request.getRequestURI())) {
      long minute = System.currentTimeMillis() / 60_000;
      if (attempts.size() > 10_000)
        attempts.entrySet().removeIf(entry -> entry.getValue().minute() < minute);
      var window =
          attempts.compute(
              request.getRemoteAddr(),
              (ip, old) ->
                  old == null || old.minute() != minute
                      ? new Window(minute, new AtomicInteger())
                      : old);
      if (window.count().incrementAndGet() > 60) {
        response.setStatus(429);
        response.setHeader("Retry-After", "60");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"요청이 많아요. 잠시 후 다시 시도해 주세요.\"}");
        return;
      }
    }
    chain.doFilter(request, response);
  }
}
