package dev.devmeet.admin;

import java.nio.file.*;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/** Explicit local setup command; never runs during application startup. */
public final class LocalAdminSetup {
  public static void main(String[] args) throws Exception {
    Path directory=Path.of(".local");
    Path properties=directory.resolve("admin.properties");
    Path credentials=directory.resolve("admin-credentials.txt");
    if (Files.exists(properties) || Files.exists(credentials))
      throw new IllegalStateException("기존 관리자 설정이 있어 덮어쓰지 않습니다: .local/admin.properties");
    Files.createDirectories(directory);
    Files.setPosixFilePermissions(directory,PosixFilePermissions.fromString("rwx------"));
    byte[] random=new byte[24];
    new SecureRandom().nextBytes(random);
    String password=Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    String hash=new BCryptPasswordEncoder(12).encode(password);
    var permissions=PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------"));
    Files.createFile(properties,permissions);
    Files.writeString(properties,"app.admin.username=admin\napp.admin.password-hash="+hash+"\n");
    Files.createFile(credentials,permissions);
    Files.writeString(credentials,"관리자 주소: http://localhost:5173/admin\n아이디: admin\n비밀번호: "+password+"\n");
    System.out.println("관리자 설정 완료. 로그인 정보: backend/.local/admin-credentials.txt (소유자만 읽기 가능)");
  }
}
