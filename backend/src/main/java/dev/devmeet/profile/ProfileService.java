package dev.devmeet.profile;

import dev.devmeet.account.Account;
import dev.devmeet.account.AccountRepository;
import dev.devmeet.common.ApiException;
import dev.devmeet.common.MemberAccess;
import dev.devmeet.config.AdminPolicy;
import dev.devmeet.matching.MatchingService;
import dev.devmeet.photo.PhotoService;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ProfileService {
  private final AccountRepository accounts;
  private final ProfileRepository profiles;
  private final QuestionCatalog catalog;
  private final MemberAccess access;
  private final PhotoService photos;
  private final MatchingService matching;
  private final AdminPolicy admins;

  public ProfileService(
      AccountRepository accounts,
      ProfileRepository profiles,
      QuestionCatalog catalog,
      MemberAccess access,
      PhotoService photos,
      MatchingService matching,
      AdminPolicy admins) {
    this.accounts = accounts;
    this.profiles = profiles;
    this.catalog = catalog;
    this.access = access;
    this.photos = photos;
    this.matching = matching;
    this.admins = admins;
  }

  public record UserView(
      UUID id,
      String email,
      ProfileRequest profile,
      Map<String, Object> verification,
      boolean admin) {}

  public UserView me(String email) {
    var account = access.account(email);
    var profile = profiles.findById(account.getId());
    return new UserView(
        account.getId(),
        account.getEmail(),
        profile.map(Profile::view).orElse(null),
        Map.of(
            "github",
            matching.github(account.getId()),
            "email",
            account.isEmailVerified(),
            "photoStatus",
            profile.map(Profile::getPhotoStatus).orElse("NONE"),
            "photoReviewReason",
            profile.map(Profile::getPhotoReviewReason).orElse("")),
        admins.isAdmin(email));
  }

  @Transactional
  public ProfileRequest save(String email, ProfileRequest request) {
    Account account = lockAccount(email);
    photos.validateOwner(account.getId(), request.photo());
    if (request.minAge() > request.maxAge()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "추천 나이 범위를 확인해 주세요.");
    }
    Profile profile =
        profiles.findById(account.getId()).orElseGet(() -> new Profile(account.getId()));
    var answers =
        request.valueAnswers() == null
            ? profile.getValueAnswers()
            : catalog.validate(request.valueAnswers());
    profile.update(request, answers);
    return profiles.saveAndFlush(profile).view();
  }

  @Transactional
  public ProfileRequest saveValues(String email, Map<String, ValueAnswer> input) {
    Account account = lockAccount(email);
    Profile profile =
        profiles
            .findById(account.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "프로필을 먼저 완성해 주세요."));
    profile.setValueAnswers(catalog.validate(input));
    return profiles.saveAndFlush(profile).view();
  }

  public Map<String, Object> publicProfile(String email, UUID id) {
    var me = access.account(email);
    access.visible(me.getId(), id);
    var profile =
        profiles
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요."));
    if (!me.getId().equals(id)
        && !admins.isAdmin(email)
        && !profile.getPhotoStatus().equals("APPROVED"))
      throw new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요.");
    var result = profile.publicView();
    result.put("githubVerified", matching.github(id));
    return result;
  }

  private Account lockAccount(String email) {
    return access.active(
        accounts
            .lockByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요.")));
  }
}
