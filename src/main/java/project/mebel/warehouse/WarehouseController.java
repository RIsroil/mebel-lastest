package project.mebel.warehouse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.mebel.warehouse.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
@Tag(name = "Warehouse", description = "Ombor boshqaruvi (faqat OWNER)")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @PostMapping("/items")
    @Operation(summary = "Yangi material qo'shish")
    public ResponseEntity<WarehouseItemResponse> createItem(@RequestBody WarehouseItemRequest request,
                                                            Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.createItem(request, principal));
    }

    @GetMapping("/items")
    @Operation(summary = "Barcha materiallar ro'yxati")
    public ResponseEntity<List<WarehouseItemResponse>> getAllItems(Principal principal) {
        return ResponseEntity.ok(warehouseService.getAllItems(principal));
    }

    @GetMapping("/items/{id}")
    @Operation(summary = "Material ma'lumotlari")
    public ResponseEntity<WarehouseItemResponse> getItemById(@PathVariable UUID id, Principal principal) {
        return ResponseEntity.ok(warehouseService.getItemById(id, principal));
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Material ma'lumotlarini yangilash")
    public ResponseEntity<WarehouseItemResponse> updateItem(@PathVariable UUID id,
                                                            @RequestBody WarehouseItemRequest request,
                                                            Principal principal) {
        return ResponseEntity.ok(warehouseService.updateItem(id, request, principal));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Materialni o'chirish (soft delete)")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID id, Principal principal) {
        warehouseService.deleteItem(id, principal);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/items/{id}/transactions")
    @Operation(summary = "Kirim / chiqim / tuzatma tranzaksiyasi")
    public ResponseEntity<WarehouseItemResponse> addTransaction(@PathVariable UUID id,
                                                                @RequestBody WarehouseTransactionRequest request,
                                                                Principal principal) {
        return ResponseEntity.ok(warehouseService.addTransaction(id, request, principal));
    }

    @GetMapping("/items/{id}/transactions")
    @Operation(summary = "Material tranzaksiyalar tarixi")
    public ResponseEntity<List<WarehouseTransactionResponse>> getTransactions(@PathVariable UUID id,
                                                                               Principal principal) {
        return ResponseEntity.ok(warehouseService.getTransactions(id, principal));
    }

    @GetMapping("/transactions/today-out")
    @Operation(summary = "Bugun ishlatilgan materiallar (OUT tranzaksiyalar)")
    public ResponseEntity<List<WarehouseTransactionResponse>> getTodayOutTransactions(Principal principal) {
        return ResponseEntity.ok(warehouseService.getTodayOutTransactions(principal));
    }
}
