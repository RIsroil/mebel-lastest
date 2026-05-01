package project.mebel.exception;

public class ResponseWrapper {

    public static <T> T success(T data, String messageKey) {
        ResponseContext.setMessage(messageKey);
        return data;
    }

    public static <T> T success(T data) {
        ResponseContext.setMessage("success");
        return data;
    }
}