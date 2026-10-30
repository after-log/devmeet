package dev.devmeet.config;

import dev.devmeet.account.AccountRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class SuspensionFilter extends OncePerRequestFilter {
  private final AccountRepository accounts;

  public SuspensionFilter(AccountRepository accounts) {
    this.accounts = accounts;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
      var account = accounts.findByEmail(auth.getName());
      if (account.isEmpty() || account.get().isSuspended()) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        response.setStatus(403);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\":\"이용이 제한된 계정이에요.\"}");
        return;
      }
    }
    chain.doFilter(request, response);
  }
}
