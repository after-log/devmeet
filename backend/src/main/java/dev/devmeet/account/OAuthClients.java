package dev.devmeet.account;

import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.*;
import org.springframework.stereotype.Component;

@Component
public class OAuthClients implements ClientRegistrationRepository {
  private final Map<String, ClientRegistration> registrations = new HashMap<>();

  public OAuthClients(
      @Value("${app.public-url}") String publicUrl,
      @Value("${app.oauth.github.client-id:}") String githubId,
      @Value("${app.oauth.github.client-secret:}") String githubSecret,
      @Value("${app.oauth.kakao.client-id:}") String kakaoId,
      @Value("${app.oauth.kakao.client-secret:}") String kakaoSecret) {
    if (!githubId.isBlank() && !githubSecret.isBlank())
      registrations.put(
          "github",
          base("github", githubId, githubSecret, publicUrl)
              .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
              .authorizationUri("https://github.com/login/oauth/authorize")
              .tokenUri("https://github.com/login/oauth/access_token")
              .userInfoUri("https://api.github.com/user")
              .userNameAttributeName("id")
              .scope("read:user", "user:email")
              .clientName("GitHub")
              .build());
    if (!kakaoId.isBlank())
      registrations.put(
          "kakao",
          base("kakao", kakaoId, kakaoSecret, publicUrl)
              .clientAuthenticationMethod(
                  kakaoSecret.isBlank()
                      ? ClientAuthenticationMethod.NONE
                      : ClientAuthenticationMethod.CLIENT_SECRET_POST)
              .authorizationUri("https://kauth.kakao.com/oauth/authorize")
              .tokenUri("https://kauth.kakao.com/oauth/token")
              .userInfoUri("https://kapi.kakao.com/v2/user/me")
              .userNameAttributeName("id")
              .scope("profile_nickname")
              .clientName("카카오")
              .build());
  }

  private ClientRegistration.Builder base(
      String provider, String id, String secret, String publicUrl) {
    return ClientRegistration.withRegistrationId(provider)
        .clientId(id)
        .clientSecret(secret)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri(publicUrl + "/login/oauth2/code/{registrationId}");
  }

  @Override
  public ClientRegistration findByRegistrationId(String id) {
    return registrations.get(id);
  }

  public Map<String, Boolean> available() {
    return Map.of(
        "github", registrations.containsKey("github"), "kakao", registrations.containsKey("kakao"));
  }
}
