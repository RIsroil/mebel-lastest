package project.mebel.furniture;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.furniture.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/furniture/orders")
@RequiredArgsConstructor
@Tag(name = "Furniture Orders", description = "Mebel buyurtmalari (faqat OWNER)")
public class FurnitureOrderController {

    private final FurnitureOrderService orderService;

    @PostMapping
    @Operation(summary = "Yangi buyurtma yaratish")
    public ResponseEntity<FurnitureOrderResponse> create(@RequestBody FurnitureOrderRequest request,
                                                         Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.createOrder(request, principal));
    }

    @GetMapping
    @Operation(summary = "Barcha buyurtmalar ro'yxati")
    public ResponseEntity<List<FurnitureOrderResponse>> getAll(Principal principal) {
        return ResponseEntity.ok(orderService.getAllOrders(principal));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buyurtma ma'lumotlari")
    public ResponseEntity<FurnitureOrderResponse> getById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(orderService.getOrderById(id, principal));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Buyurtmani yangilash")
    public ResponseEntity<FurnitureOrderResponse> update(@PathVariable UUID id,
                                                         @RequestBody FurnitureOrderRequest request,
                                                         Principal principal) {
        return ResponseEntity.ok(orderService.updateOrder(id, request, principal));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Buyurtmani o'chirish")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Principal principal) {
        orderService.deleteOrder(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Buyurtma statusini o'zgartirish")
    public ResponseEntity<FurnitureOrderResponse> changeStatus(@PathVariable UUID id,
                                                               @RequestBody StatusChangeRequest request,
                                                               Principal principal) {
        return ResponseEntity.ok(orderService.changeStatus(id, request, principal));
    }

    @PostMapping("/{id}/workers")
    @Operation(summary = "Ishchini buyurtmaga biriktirish")
    public ResponseEntity<FurnitureOrderResponse> assignWorker(@PathVariable UUID id,
                                                               @RequestBody AssignWorkerRequest request,
                                                               Principal principal) {
        return ResponseEntity.ok(orderService.assignWorker(id, request, principal));
    }

    @DeleteMapping("/{id}/workers/{workerId}")
    @Operation(summary = "Ishchini buyurtmadan chiqarish")
    public ResponseEntity<FurnitureOrderResponse> unassignWorker(@PathVariable UUID id,
                                                                  @PathVariable UUID workerId,
                                                                  Principal principal) {
        return ResponseEntity.ok(orderService.unassignWorker(id, workerId, principal));
    }

    @PostMapping("/{id}/materials")
    @Operation(summary = "Buyurtmaga material sarfini qo'shish")
    public ResponseEntity<FurnitureOrderResponse> addMaterial(@PathVariable UUID id,
                                                              @RequestBody MaterialUsageRequest request,
                                                              Principal principal) {
        return ResponseEntity.ok(orderService.addMaterialUsage(id, request, principal));
    }
}
