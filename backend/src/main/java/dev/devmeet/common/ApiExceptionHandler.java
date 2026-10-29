package dev.devmeet.common;

import java.util.Map;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException exception) {
        return ResponseEntity.status(exception.status()).body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<?> validation(MethodArgumentNotValidException exception) {
        var errors = exception.getBindingResult().getFieldErrors().stream()
            .map(error -> Map.of("field", error.getField(), "message",
                error.getDefaultMessage() == null ? "입력값을 확인해 주세요." : error.getDefaultMessage()))
            .toList();
        return ResponseEntity.badRequest().body(Map.of("message", "입력값을 확인해 주세요.", "errors", errors));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<?> unreadable() {
        return ResponseEntity.badRequest().body(Map.of("message", "요청 형식과 입력값을 확인해 주세요."));
    }

    @ExceptionHandler(AuthenticationException.class)
    ResponseEntity<?> authentication() {
        return ResponseEntity.status(401).body(Map.of("message", "이메일 또는 비밀번호가 맞지 않아요."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<?> conflict() {
        return ResponseEntity.status(409).body(Map.of("message", "중복된 정보이거나 저장 조건에 맞지 않아요."));
    }
}
