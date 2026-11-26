package dev.devmeet.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class RecoveryControllerTest {
  @Test
  void defaultLocalProfileAdvertisesPasswordLogin() {
    var environment = new MockEnvironment();
    environment.setDefaultProfiles("local");
    var controller = new RecoveryController(mock(AccountRecovery.class), environment);

    assertThat(controller.capabilities()).containsEntry("localPasswordLogin", true);
  }

  @Test
  void productionDoesNotAdvertiseLocalPasswordLogin() {
    var environment = new MockEnvironment();
    environment.setActiveProfiles("prod");
    var controller = new RecoveryController(mock(AccountRecovery.class), environment);

    assertThat(controller.capabilities()).containsEntry("localPasswordLogin", false);

    environment.setActiveProfiles("local", "prod");
    assertThat(controller.capabilities()).containsEntry("localPasswordLogin", false);
  }
}
