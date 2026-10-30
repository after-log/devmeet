package dev.devmeet.profile;

import jakarta.persistence.*;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "profiles")
public class Profile {
  @Id private UUID accountId;

  @Column(nullable = false, length = 30)
  private String name;

  @Column(nullable = false)
  private Integer age;

  @Column(nullable = false)
  private Integer height;

  @Column(nullable = false, length = 60)
  private String location;

  @Column(nullable = false, length = 60)
  private String job;

  @Column(nullable = false, length = 40)
  private String education;

  @Column(nullable = false, length = 20)
  private String role;

  @Column(nullable = false, length = 40)
  private String meeting;

  @Column(nullable = false, length = 40)
  private String contact;

  @Column(nullable = false, length = 20)
  private String preference;

  @Column(nullable = false, length = 30)
  private String smoking;

  @Column(nullable = false, length = 30)
  private String drinking;

  @Column(nullable = false, length = 30)
  private String religion;

  @Column(nullable = false, length = 1000)
  private String intro;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "json")
  private List<String> tags = List.of();

  @Column(nullable = false, columnDefinition = "mediumtext")
  private String photo;

  @Column(nullable = false)
  private Integer minAge;

  @Column(nullable = false)
  private Integer maxAge;

  @Column(nullable = false, length = 40)
  private String region;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(nullable = false, columnDefinition = "json")
  private Map<String, ValueAnswer> valueAnswers = Map.of();

  @Column(nullable = false, length = 16)
  private String photoStatus = "PENDING";

  @Column(nullable = false, length = 500)
  private String photoReviewReason = "";

  protected Profile() {}

  public Profile(UUID accountId) {
    this.accountId = accountId;
  }

  public UUID getAccountId() {
    return accountId;
  }

  public String getPhotoStatus() {
    return photoStatus;
  }

  public String getPhotoReviewReason() {
    return photoReviewReason;
  }

  public void reviewPhoto(String status, String reason) {
    photoStatus = status;
    photoReviewReason = reason;
  }

  public Map<String, ValueAnswer> getValueAnswers() {
    return valueAnswers;
  }

  public void setValueAnswers(Map<String, ValueAnswer> answers) {
    valueAnswers = Map.copyOf(answers);
  }

  public void update(ProfileRequest request, Map<String, ValueAnswer> answers) {
    if (!java.util.Objects.equals(photo, request.photo().strip())) {
      photoStatus = "PENDING";
      photoReviewReason = "";
    }
    name = request.name().strip();
    age = request.age();
    height = request.height();
    location = request.location().strip();
    job = request.job().strip();
    education = request.education().strip();
    role = request.role().strip();
    meeting = request.meeting().strip();
    contact = request.contact().strip();
    preference = request.preference().strip();
    smoking = request.smoking().strip();
    drinking = request.drinking().strip();
    religion = request.religion().strip();
    intro = request.intro().strip();
    tags = request.tags().stream().map(String::strip).toList();
    photo = request.photo().strip();
    minAge = request.minAge();
    maxAge = request.maxAge();
    region = request.region().strip();
    valueAnswers = Map.copyOf(answers);
  }

  public ProfileRequest view() {
    return new ProfileRequest(
        name,
        age,
        height,
        location,
        job,
        education,
        role,
        meeting,
        contact,
        preference,
        smoking,
        drinking,
        religion,
        intro,
        tags,
        photo,
        minAge,
        maxAge,
        region,
        valueAnswers);
  }

  public Map<String, Object> publicView() {
    Map<String, Object> result = new LinkedHashMap<>();
    result.put("id", accountId);
    result.put("name", name);
    result.put("age", age);
    result.put("height", height);
    result.put("location", location);
    result.put("job", job);
    result.put("education", education);
    result.put("role", role);
    result.put("meeting", meeting);
    result.put("contact", contact);
    result.put("smoking", smoking);
    result.put("drinking", drinking);
    result.put("religion", religion);
    result.put("intro", intro);
    result.put("tags", tags);
    result.put("photo", photo);
    Map<String, ValueAnswer> visible = new LinkedHashMap<>();
    valueAnswers.forEach(
        (id, answer) -> {
          if (answer.isPublic()) visible.put(id, answer);
        });
    result.put("valueAnswers", visible);
    result.put("photoStatus", photoStatus);
    return result;
  }
}
