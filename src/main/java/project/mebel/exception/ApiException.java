package project.mebel.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String messageKey;
    private final Object[] messageArgs;
    private Integer remainingSeconds;

    public ApiException(HttpStatus status, String messageKey) {
        super(messageKey);
        this.status = status;
        this.messageKey = messageKey;
        this.messageArgs = null;
    }

    public ApiException(HttpStatus status, String messageKey, Object... messageArgs) {
        super(messageKey);
        this.status = status;
        this.messageKey = messageKey;
        this.messageArgs = messageArgs;
    }

    public static ApiException badRequest(String messageKey) {
        return new ApiException(HttpStatus.BAD_REQUEST, messageKey);
    }

    public static ApiException badRequest(String messageKey, Object... args) {
        return new ApiException(HttpStatus.BAD_REQUEST, messageKey, args);
    }

    public static ApiException notFound(String messageKey) {
        return new ApiException(HttpStatus.NOT_FOUND, messageKey);
    }

    public static ApiException notFound(String messageKey, Object... args) {
        return new ApiException(HttpStatus.NOT_FOUND, messageKey, args);
    }

    public static ApiException forbidden(String messageKey) {
        return new ApiException(HttpStatus.FORBIDDEN, messageKey);
    }

    public static ApiException forbidden(String messageKey, Object... args) {
        return new ApiException(HttpStatus.FORBIDDEN, messageKey, args);
    }

    public static ApiException unauthorized(String messageKey) {
        return new ApiException(HttpStatus.UNAUTHORIZED, messageKey);
    }

    public static ApiException unauthorized(String messageKey, Object... args) {
        return new ApiException(HttpStatus.UNAUTHORIZED, messageKey, args);
    }

    public static ApiException internalServerError(String messageKey) {
        return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, messageKey);
    }

    public static ApiException internalServerError(String messageKey, Object... args) {
        return new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, messageKey, args);
    }

    public static ApiException conflict(String messageKey) {
        return new ApiException(HttpStatus.CONFLICT, messageKey);
    }

    public static ApiException conflict(String messageKey, Object... args) {
        return new ApiException(HttpStatus.CONFLICT, messageKey, args);
    }

    public void setRemainingSeconds(Integer remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }
}