package dev.devmeet.admin;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@WebMvcTest(controllers={AdminAuthController.class,AdminSecurityTest.Endpoints.class})
@Import({AdminSecurityConfig.class,AdminAuthentication.class,AdminSecurityTest.MemberSecurity.class,AdminSecurityTest.Endpoints.class})
class AdminSecurityTest {
  @Autowired MockMvc mvc;
  @Autowired JsonMapper json;

  @DynamicPropertySource
  static void credentials(DynamicPropertyRegistry registry) {
    registry.add("app.admin.username",()->"test-operator");
    registry.add("app.admin.password-hash",()->new BCryptPasswordEncoder(4).encode("test-only-password"));
  }

  @RestController
  static class Endpoints {
    @GetMapping("/api/admin/test") Object admin(){return Map.of("ok",true);}
    @GetMapping("/api/member-test") Object member(){return Map.of("ok",true);}
  }
  @TestConfiguration
  static class MemberSecurity {
    @Bean @Order(2)
    SecurityFilterChain memberSecurity(HttpSecurity http) {
      return http.securityContext(c->c.securityContextRepository(new HttpSessionSecurityContextRepository()))
          .authorizeHttpRequests(a->a.anyRequest().hasRole("MEMBER"))
          .exceptionHandling(e->e.authenticationEntryPoint((req,res,error)->res.setStatus(401)))
          .build();
    }
  }

  @Test
  void memberOrLegacyAdminRoleNeverGrantsOperatorAccess() throws Exception {
    var session=new MockHttpSession();
    var context=SecurityContextHolder.createEmptyContext();
    context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("member@example.test",null,AuthorityUtils.createAuthorityList("ROLE_MEMBER","ROLE_ADMIN")));
    session.setAttribute("SPRING_SECURITY_CONTEXT",context);
    mvc.perform(get("/api/admin/test").session(session)).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/admin/auth/me").session(session)).andExpect(jsonPath("$.authenticated").value(false));
    mvc.perform(get("/api/member-test").session(session)).andExpect(status().isOk());
  }

  @Test
  void loginRequiresCsrfAndPersistsOnlyTheOperatorContext() throws Exception {
    String input=json.writeValueAsString(Map.of("id","test-operator","password","test-only-password"));
    mvc.perform(post("/api/admin/auth/login").contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isForbidden());
    var result=mvc.perform(get("/api/admin/auth/csrf")).andExpect(status().isOk()).andReturn();
    var session=(MockHttpSession)result.getRequest().getSession(false);
    var token=json.readTree(result.getResponse().getContentAsString());
    mvc.perform(post("/api/admin/auth/login").session(session)
        .header(token.get("headerName").asText(),token.get("token").asText())
        .contentType(MediaType.APPLICATION_JSON).content(input)).andExpect(status().isOk());
    assertThat(session.getAttribute("DEVMEET_ADMIN_CONTEXT")).isNotNull();
    assertThat(session.getAttribute("SPRING_SECURITY_CONTEXT")).isNull();
    mvc.perform(get("/api/admin/test").session(session)).andExpect(status().isOk());
    mvc.perform(get("/api/member-test").session(session)).andExpect(status().isUnauthorized());
    mvc.perform(post("/api/admin/auth/logout").session(session)
        .header(token.get("headerName").asText(),token.get("token").asText())).andExpect(status().isForbidden());
    var next=mvc.perform(get("/api/admin/auth/csrf").session(session)).andReturn();
    var fresh=json.readTree(next.getResponse().getContentAsString());
    mvc.perform(post("/api/admin/auth/logout").session(session)
        .header(fresh.get("headerName").asText(),fresh.get("token").asText())).andExpect(status().isNoContent());
    mvc.perform(get("/api/admin/test").session(session)).andExpect(status().isUnauthorized());
  }

  @Test
  void operatorLogoutPreservesTheMemberContext() throws Exception {
    var session=new MockHttpSession();
    var member=SecurityContextHolder.createEmptyContext();
    member.setAuthentication(UsernamePasswordAuthenticationToken.authenticated("member@example.test",null,AuthorityUtils.createAuthorityList("ROLE_MEMBER")));
    session.setAttribute("SPRING_SECURITY_CONTEXT",member);
    var result=mvc.perform(get("/api/admin/auth/csrf").session(session)).andReturn();
    var token=json.readTree(result.getResponse().getContentAsString());
    mvc.perform(post("/api/admin/auth/login").session(session).header(token.get("headerName").asText(),token.get("token").asText())
        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("id","test-operator","password","test-only-password"))))
        .andExpect(status().isOk());
    var next=mvc.perform(get("/api/admin/auth/csrf").session(session)).andReturn();
    var fresh=json.readTree(next.getResponse().getContentAsString());
    mvc.perform(post("/api/admin/auth/logout").session(session).header(fresh.get("headerName").asText(),fresh.get("token").asText()))
        .andExpect(status().isNoContent());
    assertThat(session.getAttribute("SPRING_SECURITY_CONTEXT")).isNotNull();
    assertThat(session.getAttribute("DEVMEET_ADMIN_CONTEXT")).isNull();
    mvc.perform(get("/api/member-test").session(session)).andExpect(status().isOk());
  }

  @Test
  void invalidCredentialsNeverCreateAdminContext() throws Exception {
    var result=mvc.perform(get("/api/admin/auth/csrf")).andReturn();
    var session=(MockHttpSession)result.getRequest().getSession(false);
    var token=json.readTree(result.getResponse().getContentAsString());
    mvc.perform(post("/api/admin/auth/login").session(session)
        .header(token.get("headerName").asText(),token.get("token").asText())
        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("id","test-operator","password","wrong"))))
        .andExpect(status().isUnauthorized());
    assertThat(session.getAttribute("DEVMEET_ADMIN_CONTEXT")).isNull();
  }
}
