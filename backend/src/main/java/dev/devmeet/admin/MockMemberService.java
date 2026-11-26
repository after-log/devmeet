package dev.devmeet.admin;

import dev.devmeet.account.AccountRepository;
import dev.devmeet.account.RegistrationService;
import dev.devmeet.common.ApiException;
import dev.devmeet.photo.PhotoService;
import dev.devmeet.profile.ProfileRepository;
import dev.devmeet.profile.ProfileRequest;
import dev.devmeet.profile.ProfileService;
import jakarta.validation.Validator;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;
import tools.jackson.databind.node.ObjectNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class MockMemberService {
  private static final String DIRECTORY = "fixtures/";
  private static final org.slf4j.Logger log = LoggerFactory.getLogger(MockMemberService.class);

  private final AccountRepository accounts;
  private final RegistrationService registration;
  private final ProfileService profileService;
  private final ProfileRepository profiles;
  private final PhotoService photos;
  private final TransactionTemplate transaction;
  private final JdbcTemplate jdbc;
  private final Validator validator;
  private final JsonMapper json;

  public MockMemberService(
      AccountRepository accounts, RegistrationService registration, ProfileService profileService,
      ProfileRepository profiles, PhotoService photos, TransactionTemplate transaction,
      JdbcTemplate jdbc, Validator validator, JsonMapper json) {
    this.accounts = accounts;
    this.registration = registration;
    this.profileService = profileService;
    this.profiles = profiles;
    this.photos = photos;
    this.transaction = transaction;
    this.jdbc = jdbc;
    this.validator = validator;
    this.json = json;
  }

  record Fixture(String email, List<String> photoFiles, ObjectNode profile) {}

  public record Result(int created, int skipped, int failed) {}

  public Result seed(String actor, String password) {
    boolean customPassword = StringUtils.hasText(password);
    if (customPassword && (password.length() < 10 || password.getBytes(StandardCharsets.UTF_8).length > 72))
      throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 10자 이상, UTF-8 기준 72바이트 이하로 입력해 주세요.");

    Fixture[] fixtures;
    try (var input = new ClassPathResource(DIRECTORY + "mock-members.json").getInputStream()) {
      fixtures = json.readValue(input, Fixture[].class);
    } catch (IOException error) {
      throw new UncheckedIOException("Could not read mock member fixtures", error);
    }

    int created = 0, skipped = 0, failed = 0;
    for (var fixture : fixtures) {
      try {
        if (Boolean.TRUE.equals(transaction.execute(status -> {
          if (accounts.existsByEmail(fixture.email())) return false;
          create(actor, fixture, customPassword ? password : UUID.randomUUID().toString());
          return true;
        }))) created++;
        else skipped++;
      } catch (RuntimeException error) {
        if (isDuplicate(error) && accounts.existsByEmail(fixture.email())) {
          skipped++;
        } else {
          log.warn("Could not seed fixture {}", fixture.email(), error);
          failed++;
        }
      }
    }
    return new Result(created, skipped, failed);
  }

  private static boolean isDuplicate(RuntimeException error) {
    return error instanceof DataIntegrityViolationException
        || error instanceof ApiException response && response.status() == HttpStatus.CONFLICT;
  }

  private void create(String actor, Fixture fixture, String password) {
    var account = registration.register(fixture.email(), password);
    var profile = fixture.profile().deepCopy();
    var urls = profile.putArray("photos");
    for (String file : fixture.photoFiles()) {
      try (var input = new ClassPathResource(DIRECTORY + file).getInputStream()) {
        urls.add(photos.storeFixture(account.getId(), input));
      } catch (IOException error) {
        throw new UncheckedIOException("Could not load a fixture photo", error);
      }
    }
    var request = json.treeToValue(profile, ProfileRequest.class);
    if (!validator.validate(request).isEmpty())
      throw new IllegalArgumentException("Invalid mock member profile");
    profileService.save(fixture.email(), request);
    profiles.findById(account.getId()).orElseThrow().reviewPhoto("APPROVED", "");
    jdbc.update(
        "INSERT INTO admin_audit(actor,action,target_id,note) VALUES(?,'MOCK_MEMBER_CREATE',UUID_TO_BIN(?),'')",
        actor, account.getId().toString());
  }
}
