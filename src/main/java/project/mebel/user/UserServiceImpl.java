package project.mebel.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import project.mebel.exception.ApiException;
import project.mebel.exception.ApiResponseStructure;
import project.mebel.exception.ResponseHelper;
import project.mebel.utils.Utils;
import project.mebel.workshop.WorkshopEntity;
import project.mebel.workshop.WorkshopRepository;

import java.security.Principal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final Utils utils;
    private final WorkshopRepository workshopRepository;
    private final ResponseHelper responseHelper;
    private final UserRepository userRepository;

    @Override
    public ResponseEntity<ApiResponseStructure<UserProfileResponse>> getMe(Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);
        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .dailyHoursTarget(user.getDailyHoursTarget())
                .dailySalary(user.getDailySalary())
                .workshopId(user.getWorkshopId() != null ? user.getWorkshopId() : null)
                .build();
        return responseHelper.success( "get.me" ,response);
    }

    @Override
    public ResponseEntity<ApiResponseStructure<UserProfileResponse>> updateMe(UserProfileUpdateRequest request, Principal principal) {
        UserEntity user = utils.getUserFromPrincipal(principal);

        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        userRepository.save(user);

        UserProfileResponse response = UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .build();

        return responseHelper.success("update.me", response);
    }

}
