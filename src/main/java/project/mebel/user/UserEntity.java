package project.mebel.user;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import project.mebel.common.entity.SoftDeleteEntity;
import project.mebel.common.enums.PayType;
import project.mebel.common.enums.UserRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class UserEntity extends SoftDeleteEntity implements UserDetails {

    @Getter(AccessLevel.NONE)
    @Column(name = "username", nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_blocked", nullable = false)
    @Builder.Default
    private boolean blocked = false;

    @Column(name = "blocked_until")
    private LocalDateTime blockedUntil;

    @Column(name = "block_reason", columnDefinition = "TEXT")
    private String blockReason;

    @Column(name = "failed_login_count", nullable = false)
    @Builder.Default
    private short failedLoginCount = 0;

    @Column(name = "last_failed_login_at")
    private LocalDateTime lastFailedLoginAt;

    @Column(name = "workshop_id")
    private UUID workshopId;

    @Enumerated(EnumType.STRING)
    @Column(name = "pay_type")
    private PayType payType;

    @Column(name = "hourly_rate", precision = 12, scale = 2)
    private BigDecimal hourlyRate;

    @Column(name = "daily_rate", precision = 12, scale = 2)
    private BigDecimal dailyRate;

    @Column(name = "daily_hours_target", precision = 4, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal dailyHoursTarget = new BigDecimal("8.0");

    @Column(name = "daily_salary", precision = 12, scale = 2)
    private BigDecimal dailySalary;

    @Column(name = "monthly_salary", precision = 14, scale = 2)
    private BigDecimal monthlySalary;

    @Column(name = "commission_pct", precision = 5, scale = 2)
    private BigDecimal commissionPct;

    @Column(name = "is_hybrid_pay", nullable = false)
    @Builder.Default
    private boolean hybridPay = false;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !blocked;
    }

    @Override
    public boolean isEnabled() {
        return active && getDeletedAt() == null;
    }
}
