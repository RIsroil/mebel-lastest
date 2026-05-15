package project.mebel.saves;

import org.springframework.web.multipart.MultipartFile;
import project.mebel.saves.dto.FurnitureSaveRequest;
import project.mebel.saves.dto.FurnitureSaveResponse;
import project.mebel.saves.dto.SaveCutRequest;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

public interface FurnitureSaveService {

    FurnitureSaveResponse create(FurnitureSaveRequest request, Principal principal);

    List<FurnitureSaveResponse> getAll(Principal principal);

    FurnitureSaveResponse getById(UUID id, Principal principal);

    FurnitureSaveResponse update(UUID id, FurnitureSaveRequest request, Principal principal);

    void delete(UUID id, Principal principal);

    FurnitureSaveResponse addCut(UUID saveId, SaveCutRequest request, Principal principal);

    FurnitureSaveResponse updateCut(UUID saveId, UUID cutId, SaveCutRequest request, Principal principal);

    FurnitureSaveResponse removeCut(UUID saveId, UUID cutId, Principal principal);

    FurnitureSaveResponse uploadImage(UUID saveId, MultipartFile file, Principal principal);

    FurnitureSaveResponse deleteImage(UUID saveId, UUID imageId, Principal principal);

    record ImageData(byte[] bytes, String mimeType) {}

    ImageData serveImage(UUID saveId, UUID imageId);
}
