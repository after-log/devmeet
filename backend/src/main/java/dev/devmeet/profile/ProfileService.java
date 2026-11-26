package dev.devmeet.profile;

import dev.devmeet.account.Account;
import dev.devmeet.account.AccountRepository;
import dev.devmeet.common.ApiException;
import dev.devmeet.common.MemberAccess;
import dev.devmeet.matching.MatchingService;
import dev.devmeet.photo.PhotoService;
import jakarta.validation.Validator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
@Transactional(readOnly = true)
public class ProfileService {
  private static final Set<String> EDITABLE_FIELDS = Set.of(
      "name", "age", "gender", "height", "location", "job", "education", "role", "meeting", "contact",
      "preference", "smoking", "drinking", "religion", "intro", "tags", "photos");

  private final AccountRepository accounts;
  private final ProfileRepository profiles;
  private final QuestionCatalog catalog;
  private final MemberAccess access;
  private final PhotoService photos;
  private final MatchingService matching;
  private final JsonMapper json;
  private final Validator validator;

  public ProfileService(
      AccountRepository accounts,
      ProfileRepository profiles,
      QuestionCatalog catalog,
      MemberAccess access,
      PhotoService photos,
      MatchingService matching,
      JsonMapper json,
      Validator validator) {
    this.accounts = accounts;
    this.profiles = profiles;
    this.catalog = catalog;
    this.access = access;
    this.photos = photos;
    this.matching = matching;
    this.json = json;
    this.validator = validator;
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
        false);
  }

  @Transactional
  public ProfileRequest save(String email, ProfileRequest request) {
    Account account = lockAccount(email);
    requireDistinctPhotos(request.photos());
    if (request.minAge() > request.maxAge()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "추천 나이 범위를 확인해 주세요.");
    }
    Profile profile =
        profiles.findById(account.getId()).orElseGet(() -> new Profile(account.getId()));
    var answers =
        request.valueAnswers() == null
            ? profile.getValueAnswers()
            : catalog.validate(request.valueAnswers(), profile.getValueAnswers());
    request.photos().forEach(photo -> photos.validateOwner(account.getId(), photo));
    profile.update(request, answers);
    return profiles.saveAndFlush(profile).view();
  }

  @Transactional
  public ProfileRequest updateField(String email, String field, JsonNode value) {
    if (!EDITABLE_FIELDS.contains(field))
      throw new ApiException(HttpStatus.BAD_REQUEST, "편집할 프로필 항목을 확인해 주세요.");
    var input = json.createObjectNode();
    input.set(field, value);
    ProfileRequest request;
    try {
      request = json.treeToValue(input, ProfileRequest.class);
    } catch (JacksonException error) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "입력값을 확인해 주세요.");
    }
    var violations = validator.validateProperty(request, field);
    if (!violations.isEmpty())
      throw new ApiException(HttpStatus.BAD_REQUEST, violations.iterator().next().getMessage());
    if (field.equals("gender") && request.gender() == null)
      throw new ApiException(HttpStatus.BAD_REQUEST, "성별을 선택해 주세요.");

    Account account = lockAccount(email);
    Profile profile = access.profile(account.getId());
    if (field.equals("photos")) {
      requireDistinctPhotos(request.photos());
      request.photos().forEach(photo -> photos.validateOwner(account.getId(), photo));
    }
    if (field.equals("preference") && profile.view().role().equals("non-developer")
        && !request.preference().strip().equals("개발자"))
      throw new ApiException(HttpStatus.BAD_REQUEST, "비개발자는 개발자를 추천받아요.");
    profile.updateField(field, request);
    return profiles.saveAndFlush(profile).view();
  }

  private void requireDistinctPhotos(List<String> uploaded) {
    if (new HashSet<>(uploaded).size() != uploaded.size())
      throw new ApiException(HttpStatus.BAD_REQUEST, "서로 다른 사진을 최소 3장 등록해 주세요.");
  }

  @Transactional
  public ProfileRequest saveValues(String email, Map<String, ValueAnswer> input) {
    Account account = lockAccount(email);
    Profile profile =
        profiles
            .findById(account.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "프로필을 먼저 완성해 주세요."));
    profile.setValueAnswers(catalog.validate(input, profile.getValueAnswers()));
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
        && (!profile.getPhotoStatus().equals("APPROVED") || profile.getPhotos().size() < 3))
      throw new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요.");
    var result = profile.publicView();
    result.put("valueAnswers", catalog.publicAnswers(profile.getValueAnswers()));
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
