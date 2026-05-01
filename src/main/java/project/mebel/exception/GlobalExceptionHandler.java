package project.mebel.exception;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import project.mebel.config.MessageService;

@Slf4j
@ControllerAdvice
@RequiredArgsConstructor
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

    private final MessageService messageService;

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponseStructure<Object>> handleApiException(ApiException ex, WebRequest request) {
        log.warn("API Exception: {} - {} - URI: {}",
                ex.getStatus(), ex.getMessageKey(), request.getDescription(false));

        String message = resolveMessage(ex);
        Object data = ex.getRemainingSeconds() != null
                ? messageService.getMessage("error.retry.after.seconds", ex.getRemainingSeconds())
                : null;

        return ResponseEntity.status(ex.getStatus())
                .body(new ApiResponseStructure<>(false, message, data));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponseStructure<Object>> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {

        String messageKey = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(FieldError::getDefaultMessage)
                .orElse("validation.error");

        log.warn("Validation error: {} - URI: {}", messageKey, request.getDescription(false));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponseStructure<>(false, messageService.getMessage(messageKey), null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponseStructure<Object>> handleGenericException(Exception ex, WebRequest request) {
        log.error("Unexpected error - URI: {}", request.getDescription(false), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiResponseStructure<>(false, messageService.getMessage("system.unexpected.error"), null));
    }

    private String resolveMessage(ApiException ex) {
        try {
            Object[] args = ex.getMessageArgs();
            return (args != null && args.length > 0)
                    ? messageService.getMessage(ex.getMessageKey(), args)
                    : messageService.getMessage(ex.getMessageKey());
        } catch (Exception e) {
            return ex.getMessageKey();
        }
    }
}