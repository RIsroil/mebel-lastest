package project.mebel.exception;

public class ResponseContext {

    private static final ThreadLocal<String> messageHolder = new ThreadLocal<>();

    public static void setMessage(String messageKey) {
        messageHolder.set(messageKey);
    }

    public static String getMessage() {
        return messageHolder.get();
    }

    public static void clear() {
        messageHolder.remove();
    }
}