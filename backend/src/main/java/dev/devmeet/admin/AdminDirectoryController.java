package dev.devmeet.admin;

import dev.devmeet.photo.PhotoService;
import java.util.*;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.json.JsonMapper;

@RestController
@RequestMapping("/api/admin")
@Transactional(readOnly=true)
public class AdminDirectoryController {
  private final JdbcTemplate jdbc;
  private final JsonMapper json;
  private final PhotoService photos;

  public AdminDirectoryController(JdbcTemplate jdbc, JsonMapper json, PhotoService photos) {
    this.jdbc = jdbc;
    this.json = json;
    this.photos = photos;
  }

  @GetMapping("/accounts")
  public Object accounts() {
    return jdbc.query("""
        SELECT BIN_TO_UUID(a.id) id,a.email,a.suspended,a.created_at,
               p.name,p.age,p.job,p.location,p.photos,p.photo_status,p.photo_review_reason
        FROM accounts a LEFT JOIN profiles p ON p.account_id=a.id
        ORDER BY a.created_at DESC,a.id
        """, (rs, index) -> {
      var row = new LinkedHashMap<String,Object>();
      boolean hasProfile = rs.getString("name") != null;
      List<String> originals = rs.getString("photos") == null ? List.of()
          : List.of(json.readValue(rs.getString("photos"), String[].class));
      row.put("id", rs.getString("id"));
      row.put("email", rs.getString("email"));
      row.put("suspended", rs.getBoolean("suspended"));
      row.put("hasProfile", hasProfile);
      row.put("name", hasProfile ? rs.getString("name") : "프로필 미등록");
      row.put("age", rs.getInt("age"));
      row.put("role", hasProfile ? rs.getString("job") : "미등록");
      row.put("region", hasProfile ? rs.getString("location") : "");
      row.put("joined", rs.getTimestamp("created_at").toInstant());
      row.put("photos", originals.stream().map(url -> url.replace("/api/photos/", "/api/admin/photo-files/")).toList());
      row.put("reviewPhotos", originals);
      row.put("review", hasProfile ? rs.getString("photo_status") : "NONE");
      row.put("reason", hasProfile ? rs.getString("photo_review_reason") : "");
      return row;
    });
  }

  @GetMapping("/reports")
  public Object reports() {
    return jdbc.query("""
        SELECT BIN_TO_UUID(r.id) id,BIN_TO_UUID(r.sender_id) sender_id,
               BIN_TO_UUID(r.target_id) target_id,r.reason,r.status,r.review_note,r.created_at,
               COALESCE(s.name,sa.email) sender,COALESCE(t.name,ta.email) target
        FROM reports r JOIN accounts sa ON sa.id=r.sender_id JOIN accounts ta ON ta.id=r.target_id
        LEFT JOIN profiles s ON s.account_id=r.sender_id LEFT JOIN profiles t ON t.account_id=r.target_id
        ORDER BY r.created_at DESC,r.id
        """, (rs,index) -> Map.of(
          "id",rs.getString("id"), "sender",rs.getString("sender"), "target",rs.getString("target"),
          "senderId",rs.getString("sender_id"), "targetId",rs.getString("target_id"),
          "reason",rs.getString("reason"), "detail",rs.getString("reason"),
          "status",rs.getString("status"), "note",rs.getString("review_note"),
          "date",rs.getTimestamp("created_at").toInstant()));
  }

  @GetMapping("/photo-files/{id}")
  public ResponseEntity<?> photo(@PathVariable UUID id) {
    return ResponseEntity.ok().contentType(MediaType.IMAGE_JPEG).cacheControl(CacheControl.noStore())
        .header("X-Content-Type-Options","nosniff")
        .body(new FileSystemResource(photos.read("",id,true)));
  }
}
