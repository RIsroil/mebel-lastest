package project.mebel.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import project.mebel.common.enums.UserRole;
import project.mebel.user.UserEntity;
import project.mebel.user.UserRepository;
import project.mebel.user.enums.Role;
import project.mebel.user.enums.Status;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
               if (userRepository.findByUsernameAndDeletedAtIsNull("admin").isEmpty()) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setFullName("Administrator");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            userRepository.save(admin);
            System.out.println("✔ Admin user created: admin");
        }
    }
}
