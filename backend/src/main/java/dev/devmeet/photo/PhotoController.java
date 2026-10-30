package dev.devmeet.photo;

import java.io.IOException;
import java.util.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class PhotoController {
  private final PhotoService photos;

  public PhotoController(PhotoService photos) {
    this.photos = photos;
  }

  @PostMapping("/photo")
  public Object upload(Authentication auth, @RequestParam MultipartFile file) throws IOException {
    return Map.of("photo", photos.upload(auth.getName(), file));
  }

  @GetMapping("/photos/{id}")
  public ResponseEntity<?> photo(Authentication auth, @PathVariable UUID id) {
    boolean admin =
        auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    var path = photos.read(auth.getName(), id, admin);
    return ResponseEntity.ok()
        .contentType(MediaType.IMAGE_JPEG)
        .cacheControl(CacheControl.noStore())
        .header("X-Content-Type-Options", "nosniff")
        .body(new FileSystemResource(path));
  }
}
