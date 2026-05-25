package project.mebel.furniture;

import org.springframework.web.multipart.MultipartFile;
import project.mebel.furniture.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

public interface FurnitureOrderService {

    FurnitureOrderResponse createOrder(FurnitureOrderRequest request, Principal principal);

    FurnitureOrderResponse createOrderFromSave(UUID saveId, CreateOrderFromSaveRequest request, Principal principal);

    List<FurnitureOrderResponse> getAllOrders(Principal principal);

    List<FurnitureOrderResponse> getWorkerOrders(Principal principal);

    FurnitureOrderResponse getOrderById(UUID id, Principal principal);

    FurnitureOrderResponse updateOrder(UUID id, FurnitureOrderRequest request, Principal principal);

    void deleteOrder(UUID id, Principal principal);

    FurnitureOrderResponse changeStatus(UUID id, StatusChangeRequest request, Principal principal);

    FurnitureOrderResponse assignWorker(UUID orderId, AssignWorkerRequest request, Principal principal);

    FurnitureOrderResponse unassignWorker(UUID orderId, UUID workerId, Principal principal);

    FurnitureOrderResponse reactivateWorker(UUID orderId, UUID workerId, Principal principal);

    FurnitureOrderResponse addMaterialUsage(UUID orderId, MaterialUsageRequest request, Principal principal);

    FurnitureOrderResponse removeMaterialUsage(UUID orderId, UUID usageId, Principal principal);

    FurnitureOrderResponse adjustMaterialUsage(UUID orderId, UUID usageId, AdjustMaterialRequest request, Principal principal);

    FurnitureOrderResponse togglePin(UUID orderId, Principal principal);

    FurnitureOrderResponse uploadImage(UUID orderId, MultipartFile file, Principal principal);

    FurnitureOrderResponse deleteImage(UUID orderId, UUID imageId, Principal principal);

    record ImageData(byte[] bytes, String mimeType) {}

    ImageData serveImage(UUID orderId, UUID imageId);
}
