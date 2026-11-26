package dev.devmeet.admin;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Explicit local setup command; never runs during application startup. */
public final class LocalAdminSetup {
  public static void main(String[] args) throws Exception {
    Path directory = Path.of(".local");
    Path properties = directory.resolve("admin.properties");
    Path credentials = directory.resolve("admin-credentials.txt");
    if (Files.exists(properties) || Files.exists(credentials)) {
      System.out.println("이미 로컬 관리자 설정이 있어요.");
      return;
    }

    String password = System.getenv("LOCAL_ADMIN_PASSWORD");
    boolean generated = password == null;
    if (generated) {
      byte[] random = new byte[24];
      new SecureRandom().nextBytes(random);
      password = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    } else if (password.isBlank() || password.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw new IllegalArgumentException("LOCAL_ADMIN_PASSWORD를 UTF-8 기준 1~72바이트로 지정해 주세요.");
    }

    String hash = new BCryptPasswordEncoder(12).encode(password);
    Files.createDirectories(directory);
    Files.setPosixFilePermissions(directory, PosixFilePermissions.fromString("rwx------"));
    writePrivateFile(properties, "app.admin.username=admin\napp.admin.password-hash=" + hash + "\n");
    writePrivateFile(
        credentials,
        "관리자 주소: http://localhost:5173/admin\n아이디: admin\n비밀번호: "
            + (generated ? password : "초기 설정에 지정한 LOCAL_ADMIN_PASSWORD 사용") + "\n");
    System.out.println("관리자 설정 완료. 로그인 정보: backend/.local/admin-credentials.txt (소유자만 읽기 가능)");
  }

  private static void writePrivateFile(Path path, String content) throws IOException {
    var permissions = PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------"));
    Path temporary = Files.createTempFile(path.getParent(), ".admin-", ".tmp", permissions);
    try {
      Files.writeString(temporary, content);
      Files.createLink(path, temporary);
    } finally {
      Files.deleteIfExists(temporary);
    }
  }
}
