package dev.devmeet.profile;

import dev.devmeet.account.Account;
import dev.devmeet.account.AccountRepository;
import dev.devmeet.common.ApiException;
import java.util.LinkedHashMap;
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

    public ProfileService(AccountRepository accounts, ProfileRepository profiles, QuestionCatalog catalog) {
        this.accounts = accounts;
        this.profiles = profiles;
        this.catalog = catalog;
    }

    public record UserView(UUID id, String email, ProfileRequest profile) {}

    public UserView me(String email) {
        var account = accounts.findByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."));
        return new UserView(account.getId(), account.getEmail(),
            profiles.findById(account.getId()).map(Profile::view).orElse(null));
    }

    @Transactional
    public ProfileRequest save(String email, ProfileRequest request) {
        Account account = lockAccount(email);
        if (request.minAge() > request.maxAge()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "추천 나이 범위를 확인해 주세요.");
        }
        Profile profile = profiles.findById(account.getId()).orElseGet(() -> new Profile(account.getId()));
        var answers = request.valueAnswers() == null ? profile.getValueAnswers()
            : catalog.validate(request.valueAnswers());
        profile.update(request, answers);
        return profiles.saveAndFlush(profile).view();
    }

    @Transactional
    public ProfileRequest saveValues(String email, Map<String, ValueAnswer> input) {
        Account account = lockAccount(email);
        Profile profile = profiles.findById(account.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "프로필을 먼저 완성해 주세요."));
        profile.setValueAnswers(catalog.validate(input));
        return profiles.saveAndFlush(profile).view();
    }

    public Map<String, Object> publicProfile(UUID id) {
        var profile = profiles.findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "프로필을 찾을 수 없어요."));
        return profile.publicView();
    }

    private Account lockAccount(String email) {
        return accounts.lockByEmail(email)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."));
    }
}
