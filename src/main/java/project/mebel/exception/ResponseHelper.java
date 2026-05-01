package project.mebel.exception;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import project.mebel.config.MessageService;

@Slf4j
@Component // Make it a Spring component
@RequiredArgsConstructor
public class ResponseHelper {

    private final MessageService messageService;

    public <T> ResponseEntity<ApiResponseStructure<T>> success(String messageKey, T data) {
        String message = messageService != null ? messageService.getMessage(messageKey) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(true, message, data);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> success(String messageKey) {
        String message = messageService != null ? messageService.getMessage(messageKey) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(true, message, null);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> success(String messageKey, Object[] args, T data) {
        String message = messageService != null ? messageService.getMessage(messageKey, args) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(true, message, data);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> created(String messageKey, T data) {
        String message = messageService != null ? messageService.getMessage(messageKey) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(true, message, data);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> error(HttpStatus status, String messageKey) {
        String message = messageService != null ? messageService.getMessage(messageKey) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(false, message, null);
        return ResponseEntity.status(status).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> error(HttpStatus status, String messageKey, Object... args) {
        String message = messageService != null ? messageService.getMessage(messageKey, args) : messageKey;
        ApiResponseStructure<T> response = new ApiResponseStructure<>(false, message, null);
        return ResponseEntity.status(status).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> error(ApiException exception) {
        String message;
        if (messageService != null) {
            Object[] args = exception.getMessageArgs();
            try {
                message = (args != null && args.length > 0)
                        ? messageService.getMessage(exception.getMessageKey(), args)
                        : messageService.getMessage(exception.getMessageKey());
            } catch (Exception ex) {
                // Fallback to key if formatting fails
                log.debug("Message formatting failed for key: {}", exception.getMessageKey(), ex);
                message = exception.getMessageKey();
            }
        } else {
            message = exception.getMessageKey();
        }

        // If there are remaining seconds, include them in the response data for OTP countdown
        T data = null;

        ApiResponseStructure<T> response = new ApiResponseStructure<>(false, message, null);
        return ResponseEntity.status(exception.getStatus()).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> build(boolean success, String message, T data, HttpStatus status) {
        ApiResponseStructure<T> response = new ApiResponseStructure<>(success, message, data);
        return ResponseEntity.status(status).body(response);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> badRequest(String messageKey) {
        return error(HttpStatus.BAD_REQUEST, messageKey);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> badRequest(String messageKey, Object... args) {
        return error(HttpStatus.BAD_REQUEST, messageKey, args);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> notFound(String messageKey) {
        return error(HttpStatus.NOT_FOUND, messageKey);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> unauthorized(String messageKey) {
        return error(HttpStatus.UNAUTHORIZED, messageKey);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> forbidden(String messageKey) {
        return error(HttpStatus.FORBIDDEN, messageKey);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> internalServerError(String messageKey) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, messageKey);
    }

    public <T> ResponseEntity<ApiResponseStructure<T>> conflict(String messageKey) {
        return error(HttpStatus.CONFLICT, messageKey);
    }
}