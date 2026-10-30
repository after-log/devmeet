package dev.devmeet.profile;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

public record ValueAnswer(String choice, @JsonProperty("private") Boolean hidden) {
  @JsonIgnore
  public boolean isPublic() {
    return choice != null && Boolean.FALSE.equals(hidden);
  }
}
