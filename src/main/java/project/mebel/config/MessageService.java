package project.mebel.config;


import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageSource messageSource;

    public String getMessage(String code) {
        return messageSource.getMessage(code, null, code, LocaleContextHolder.getLocale());
    }

    public String getMessage(String code, Object... args) {
        return messageSource.getMessage(code, args, code, LocaleContextHolder.getLocale());
    }

    public String getMessage(String code, Locale locale) {
        return messageSource.getMessage(code, null, code, locale);
    }

    public String getMessage(String code, Object[] args, Locale locale) {
        return messageSource.getMessage(code, args, code, locale);
    }

    public String getMessage(String code, HttpServletRequest request) {
        Locale locale = getLocaleFromRequest(request);
        return messageSource.getMessage(code, null, code, locale);
    }

    private Locale getLocaleFromRequest(HttpServletRequest request) {
        String acceptLanguage = request.getHeader("Accept-Language");
        if (acceptLanguage != null && !acceptLanguage.isEmpty()) {
            String[] languages = acceptLanguage.split(",");
            String primaryLang = languages[0].trim();
            if (primaryLang.startsWith("uz")) return new Locale("uz");
            if (primaryLang.startsWith("ru")) return new Locale("ru");
        }
        return new Locale("en");
    }

    // Added overloads to support telegram usage with language code string
    public String getMessage(String code, String lang) {
        if (lang == null || lang.isBlank()) {
            return getMessage(code);
        }
        Locale locale = new Locale(lang);
        return messageSource.getMessage(code, null, code, locale);
    }

    public String getMessage(String code, String lang, Object... args) {
        if (lang == null || lang.isBlank()) {
            return getMessage(code, args);
        }
        Locale locale = new Locale(lang);
        return messageSource.getMessage(code, args, code, locale);
    }
}
