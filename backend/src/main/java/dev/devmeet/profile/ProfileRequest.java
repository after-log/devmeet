package dev.devmeet.profile;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Map;

public record ProfileRequest(
    @NotBlank(message = "프로필 이름을 입력해 주세요.") @Size(max = 30) String name,
    @NotNull @Min(19) @Max(80) Integer age,
    @NotNull @Min(100) @Max(250) Integer height,
    @NotBlank @Size(max = 60) String location,
    @NotBlank @Size(max = 60) String job,
    @NotBlank @Size(max = 40) String education,
    @NotBlank @Pattern(regexp = "developer|non-developer") String role,
    @NotBlank @Size(max = 40) String meeting,
    @NotBlank @Size(max = 40) String contact,
    @NotBlank @Size(max = 20) String preference,
    @NotBlank @Size(max = 30) String smoking,
    @NotBlank @Size(max = 30) String drinking,
    @NotBlank @Size(max = 30) String religion,
    @NotBlank(message = "자기소개를 입력해 주세요.") @Size(max = 1000) String intro,
    @NotNull @Size(max = 5) List<@NotBlank @Size(max = 20) String> tags,
    @NotBlank
        @Size(max = 2000000)
        @Pattern(
            regexp =
                "https://[^\\s]+|/api/photos/[0-9a-fA-F-]{36}|data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+")
        String photo,
    @NotNull @Min(19) @Max(80) Integer minAge,
    @NotNull @Min(19) @Max(80) Integer maxAge,
    @NotNull @Size(max = 40) String region,
    @Size(max = 80) Map<String, ValueAnswer> valueAnswers) {}
