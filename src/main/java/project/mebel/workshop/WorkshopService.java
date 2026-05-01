package project.mebel.workshop;

import project.mebel.workshop.dto.WorkshopRequest;
import project.mebel.workshop.dto.WorkshopResponse;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

public interface WorkshopService {

    WorkshopResponse create(WorkshopRequest request, Principal principal);

    List<WorkshopResponse> getAll(Principal principal);

    WorkshopResponse getById(UUID id, Principal principal);

    WorkshopResponse update(UUID id, WorkshopRequest request, Principal principal);

    void delete(UUID id, Principal principal);
}
