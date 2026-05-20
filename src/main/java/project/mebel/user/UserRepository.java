package project.mebel.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<UserEntity, UUID>, JpaSpecificationExecutor<UserEntity> {

    Optional<UserEntity> findByUsernameAndDeletedAtIsNull(String username);

    UserEntity findByUsername(String username);

    @Query(value = "SELECT * FROM users WHERE id = :id", nativeQuery = true)
    Optional<UserEntity> findByIdIncludeDeleted(@Param("id") UUID id);
}
