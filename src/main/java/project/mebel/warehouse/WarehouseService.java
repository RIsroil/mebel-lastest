package project.mebel.warehouse;

import project.mebel.warehouse.dto.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

public interface WarehouseService {

    WarehouseItemResponse createItem(WarehouseItemRequest request, Principal principal);

    List<WarehouseItemResponse> getAllItems(Principal principal);

    WarehouseItemResponse getItemById(UUID id, Principal principal);

    WarehouseItemResponse updateItem(UUID id, WarehouseItemRequest request, Principal principal);

    void deleteItem(UUID id, Principal principal);

    WarehouseItemResponse addTransaction(UUID itemId, WarehouseTransactionRequest request, Principal principal);

    List<WarehouseTransactionResponse> getTransactions(UUID itemId, Principal principal);

    List<WarehouseTransactionResponse> getTodayOutTransactions(Principal principal);
}
