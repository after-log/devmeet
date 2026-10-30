package dev.devmeet.photo;

import dev.devmeet.common.*;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.file.*;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.stream.ImageInputStream;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PhotoService {
  private final MemberAccess access;
  private final JdbcTemplate jdbc;
  private final Path directory;

  public PhotoService(
      MemberAccess access,
      JdbcTemplate jdbc,
      @Value("${app.photo-directory:./data/photos}") String directory) {
    this.access = access;
    this.jdbc = jdbc;
    this.directory = Path.of(directory).toAbsolutePath().normalize();
  }

  @Transactional
  public String upload(String email, MultipartFile file) throws IOException {
    UUID owner = access.account(email).getId();
    access.lock(owner);
    var start =
        java.time.LocalDate.now(java.time.ZoneId.of("Asia/Seoul"))
            .atStartOfDay(java.time.ZoneId.of("Asia/Seoul"))
            .toInstant();
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM photos WHERE owner_id=UUID_TO_BIN(?) AND created_at>=?",
            Integer.class,
            owner.toString(),
            java.sql.Timestamp.from(start))
        >= 20) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "사진은 하루 최대 20번 등록할 수 있어요.");
    if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
      throw new ApiException(HttpStatus.BAD_REQUEST, "10MB 이하의 사진을 선택해 주세요.");
    BufferedImage image;
    try (ImageInputStream input = ImageIO.createImageInputStream(file.getInputStream())) {
      var readers = ImageIO.getImageReaders(input);
      if (!readers.hasNext())
        throw new ApiException(HttpStatus.BAD_REQUEST, "JPEG 또는 PNG 사진을 선택해 주세요.");
      var reader = readers.next();
      try {
        reader.setInput(input);
        int width = reader.getWidth(0), height = reader.getHeight(0);
        if (width < 1 || height < 1 || (long) width * height > 40_000_000)
          throw new ApiException(HttpStatus.BAD_REQUEST, "사진 해상도가 너무 커요.");
        image = reader.read(0);
      } finally {
        reader.dispose();
      }
    }
    double ratio = Math.min(1, 640.0 / Math.max(image.getWidth(), image.getHeight()));
    var resized =
        new BufferedImage(
            Math.max(1, (int) (image.getWidth() * ratio)),
            Math.max(1, (int) (image.getHeight() * ratio)),
            BufferedImage.TYPE_INT_RGB);
    Graphics2D graphics = resized.createGraphics();
    try {
      graphics.setColor(Color.WHITE);
      graphics.fillRect(0, 0, resized.getWidth(), resized.getHeight());
      graphics.setRenderingHint(
          RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
      graphics.drawImage(image, 0, 0, resized.getWidth(), resized.getHeight(), null);
    } finally {
      graphics.dispose();
    }
    UUID id = UUID.randomUUID();
    Files.createDirectories(directory);
    Path destination = directory.resolve(id + ".jpg");
    ImageIO.write(resized, "jpeg", destination.toFile());
    try {
      jdbc.update(
          "INSERT INTO photos(id,owner_id) VALUES(UUID_TO_BIN(?),UUID_TO_BIN(?))",
          id.toString(),
          owner.toString());
    } catch (RuntimeException error) {
      Files.deleteIfExists(destination);
      throw error;
    }
    return "/api/photos/" + id;
  }

  public void validateOwner(UUID owner, String photo) {
    if (!photo.startsWith("/api/photos/"))
      return; // Existing HTTPS/data URL profiles remain compatible.
    UUID id;
    try {
      id = UUID.fromString(photo.substring("/api/photos/".length()));
    } catch (IllegalArgumentException error) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "사진 주소를 확인해 주세요.");
    }
    if (jdbc.queryForObject(
            "SELECT COUNT(*) FROM photos WHERE id=UUID_TO_BIN(?) AND owner_id=UUID_TO_BIN(?)",
            Integer.class,
            id.toString(),
            owner.toString())
        == 0) throw new ApiException(HttpStatus.FORBIDDEN, "본인이 올린 사진만 사용할 수 있어요.");
  }

  @Transactional(readOnly = true)
  public Path read(String email, UUID id, boolean admin) {
    UUID me = access.account(email).getId();
    var owners =
        jdbc.queryForList(
            "SELECT BIN_TO_UUID(owner_id) FROM photos WHERE id=UUID_TO_BIN(?)",
            String.class,
            id.toString());
    if (owners.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "사진을 찾을 수 없어요.");
    UUID owner = UUID.fromString(owners.getFirst());
    if (!admin && !me.equals(owner)) {
      access.visible(me, owner);
      var profile = access.profile(owner);
      if (!profile.getPhotoStatus().equals("APPROVED")
          || !profile.view().photo().equals("/api/photos/" + id))
        throw new ApiException(HttpStatus.NOT_FOUND, "사진을 찾을 수 없어요.");
    }
    Path path = directory.resolve(id + ".jpg");
    if (!Files.isRegularFile(path)) throw new ApiException(HttpStatus.NOT_FOUND, "사진을 찾을 수 없어요.");
    return path;
  }
}
