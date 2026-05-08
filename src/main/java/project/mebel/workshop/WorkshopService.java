package project.mebel.workshop;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import project.mebel.common.enums.AttendanceMode;
import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.util.UUID;

public interface WorkshopService {

    WorkshopResponse create(WorkshopRequest request, Principal principal);

    Page<WorkshopResponse> getAll(Principal principal, Pageable pageable);

    WorkshopResponse getById(UUID id, Principal principal);

    WorkshopResponse update(UUID id, WorkshopRequest request, Principal principal);

    void delete(UUID id, Principal principal);

    WorkshopResponse updateAttendanceMode(UUID id, AttendanceMode mode, Principal principal);
}
