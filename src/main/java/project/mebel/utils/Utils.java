package project.mebel.utils;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import project.mebel.config.MessageService;
import project.mebel.exception.ApiException;
import project.mebel.user.UserEntity;

import java.security.Principal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class Utils {

    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final MessageService messageService;

    public UserEntity getUserFromPrincipal(Principal principal) {
        if (principal == null) {
            throw ApiException.unauthorized("user.is.not.authenticated");
        }
        UserDetails userDetails = userDetailsService.loadUserByUsername(principal.getName());
        if (!(userDetails instanceof UserEntity)) {
            throw ApiException.internalServerError("invalid.user.details");
        }
        return (UserEntity) userDetails;
    }

    public String getTranslatedSystemError(MessageService messageService, String key) {
        String template = messageService.getMessage("system.error.occurred.in");
        return String.format(template, key);
    }

}