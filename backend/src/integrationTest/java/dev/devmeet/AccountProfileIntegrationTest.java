package dev.devmeet;

import dev.devmeet.profile.QuestionCatalog;
import dev.devmeet.profile.ValueAnswer;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("integration")
class AccountProfileIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JsonMapper json;
    @Autowired JdbcTemplate jdbc;
    @Autowired QuestionCatalog catalog;

    private String email() { return UUID.randomUUID() + "@example.test"; }

    private MockHttpSession register(String email) throws Exception {
        return (MockHttpSession) mvc.perform(post("/api/register").with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", "test-password-123"))))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.user.email").value(email))
            .andReturn().getRequest().getSession(false);
    }

    private Map<String, Object> profile() {
        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("name", "테스트");
        profile.put("age", 29);
        profile.put("height", 172);
        profile.put("location", "서울시 성동구");
        profile.put("job", "개발자");
        profile.put("education", "대학교 졸업");
        profile.put("role", "developer");
        profile.put("meeting", "주말에 1–2번");
        profile.put("contact", "바쁜 날에도 짧은 안부");
        profile.put("preference", "상관없어요");
        profile.put("smoking", "비흡연");
        profile.put("drinking", "가끔");
        profile.put("religion", "무교");
        profile.put("intro", "산책과 커피를 좋아해요.");
        profile.put("tags", java.util.List.of("산책"));
        profile.put("photo", "https://example.test/photo.jpg");
        profile.put("minAge", 19);
        profile.put("maxAge", 60);
        profile.put("region", "");
        return profile;
    }

    @Test
    void sessionPersistsWithRealCsrfTokenAndRotatesOnLogin() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isOk()).andExpect(jsonPath("$.user").isEmpty());
        mvc.perform(put("/api/profile").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/register").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email(), "password", "test-password-123"))))
            .andExpect(status().isForbidden());

        var csrfResponse = mvc.perform(get("/api/csrf")).andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) csrfResponse.getRequest().getSession(false);
        String before = session.getId();
        var token = json.readTree(csrfResponse.getResponse().getContentAsString());
        String address = email();
        mvc.perform(post("/api/register").session(session)
                .with(request -> {
                    request.setRequestedSessionId(session.getId());
                    request.setRequestedSessionIdValid(true);
                    return request;
                })
                .header(token.get("headerName").asText(), token.get("token").asText())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", address, "password", "test-password-123"))))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.user.profile").isEmpty());
        assertThat(session.getId()).isNotEqualTo(before);
        mvc.perform(get("/api/me").session(session)).andExpect(jsonPath("$.user.email").value(address));
        mvc.perform(put("/api/profile").session(session)
                .header(token.get("headerName").asText(), token.get("token").asText())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(profile())))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/logout").session(session).with(csrf())).andExpect(status().isNoContent());
        mvc.perform(get("/api/me")).andExpect(jsonPath("$.user").isEmpty());
        mvc.perform(post("/api/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", address, "password", "incorrect-password"))))
            .andExpect(status().isUnauthorized());
        var login = mvc.perform(post("/api/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", address.toUpperCase(), "password", "test-password-123"))))
            .andExpect(status().isOk()).andReturn();
        var loginSession = (MockHttpSession) login.getRequest().getSession(false);
        mvc.perform(get("/api/me").session(loginSession)).andExpect(jsonPath("$.user.email").value(address));
        assertThat(jdbc.queryForObject("select password_hash from accounts where email = ?", String.class, address))
            .startsWith("$2").isNotEqualTo("test-password-123");
        mvc.perform(post("/api/register").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", address, "password", "test-password-123"))))
            .andExpect(status().isConflict());
    }

    @Test
    void valuesPersistArePrivateByDefaultAndPublicResponsesContainOnlyChosenTen() throws Exception {
        var owner = register(email());
        var viewer = register(email());
        var me = mvc.perform(get("/api/me").session(owner)).andReturn();
        String id = json.readTree(me.getResponse().getContentAsString()).get("user").get("id").asText();
        mvc.perform(put("/api/profile").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(profile())))
            .andExpect(status().isOk());
        Map<String, ValueAnswer> answers = new LinkedHashMap<>();
        var questions = catalog.sections().stream().flatMap(section -> section.questions().stream()).toList();
        for (int i = 0; i < questions.size(); i++) {
            var question = questions.get(i);
            answers.put(question.id(), new ValueAnswer(question.options().getFirst(), i >= 10));
        }
        mvc.perform(put("/api/profile/values").session(owner).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("valueAnswers", answers))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.profile.valueAnswers.length()").value(80));
        mvc.perform(get("/api/people/" + id).session(viewer)).andExpect(status().isOk())
            .andExpect(jsonPath("$.person.valueAnswers.length()").value(10))
            .andExpect(jsonPath("$.person.valueAnswers.D11").doesNotExist())
            .andExpect(jsonPath("$.person.email").doesNotExist())
            .andExpect(jsonPath("$.person.minAge").doesNotExist());
        mvc.perform(get("/api/me").session(viewer)).andExpect(jsonPath("$.user.profile").isEmpty());

        var eleventh = questions.get(10);
        answers.put(eleventh.id(), new ValueAnswer(eleventh.options().getFirst(), false));
        mvc.perform(put("/api/profile/values").session(owner).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of("valueAnswers", answers))))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("10개")));
        assertThatThrownBy(() -> jdbc.update("update profiles set value_answers = CAST(? AS JSON) where account_id = UUID_TO_BIN(?)",
            json.writeValueAsString(answers), id)).isInstanceOf(DataIntegrityViolationException.class);
        mvc.perform(put("/api/profile").session(owner).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(profile())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.profile.valueAnswers.length()").value(80));

        mvc.perform(put("/api/profile/values").session(owner).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"valueAnswers\":{\"D01\":{\"choice\":\"집에서 휴식\"}}}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.profile.valueAnswers.D01.private").value(true));
        mvc.perform(put("/api/profile/values").session(owner).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"valueAnswers\":{}}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.profile.valueAnswers.length()").value(0));
    }

    @Test
    void rejectsInvalidProfilesAndQuestionChoices() throws Exception {
        var session = register(email());
        var invalid = profile();
        invalid.put("age", 18);
        mvc.perform(put("/api/profile").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("age"));
        invalid.put("age", 25.5);
        mvc.perform(put("/api/profile").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest());
        invalid = profile();
        invalid.put("minAge", 50);
        invalid.put("maxAge", 25);
        mvc.perform(put("/api/profile").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest());
        invalid = profile();
        invalid.put("valueAnswers", Map.of("D01", new ValueAnswer("invalid", false)));
        mvc.perform(put("/api/profile").session(session).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void healthAndCatalogAreAvailableWithoutLogin() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("UP"));
        mvc.perform(get("/api/value-questions")).andExpect(status().isOk())
            .andExpect(jsonPath("$.sections.length()").value(5)).andExpect(jsonPath("$.publicLimit").value(10));
    }
}
