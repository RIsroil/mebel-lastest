# Oxirgi ishlar — Mebel MS

## 1. Ombor material o'chirish + bugun statistikasi
**Commit:** `2db783a` — feat: add functionality to remove materials from furniture orders and track today's material usage

### Backend
- `DELETE /api/warehouse/items/{id}` — soft delete, moliyaviy jurnalga "Material o'chirildi: ..." yozadi (qiymat negate)
- `GET /api/warehouse/transactions/today-out` — bugun ishlatilgan barcha OUT tranzaksiyalar
- `DELETE /api/furniture/orders/{id}/materials/{usageId}` — buyurtmadan material olib tashlash:
  - Agar warehouse item soft-deleted → restore qiladi (deletedAt=null)
  - Agar active → IN tranzaksiya yaratadi, weighted avg price hisoblaydi
  - Moliyaviy jurnalga teskari (positive) yozuv qiladi
  - `WarehouseItemRepository.findByIdAndWorkshopIdIncludeDeleted` — native query, `@SQLRestriction` ni bypass qiladi

### Frontend (WarehousePage)
- Stats kartalari — ombor umumiy qiymati + bugun ishlatilgan (bosib modal ochiladi)
- Bugun ishlatilgan modal — material, miqdor, jami, vaqt jadvali
- 🗑 O'chirish tugmasi — jadval va mobil kartada, confirm dialog bilan
- Mobil: stats vertikal stack, modal'da Narx va Vaqt yashiriladi

### Frontend (OrderDetailPage)
- × tugmasi — har bir material qatoriga, faqat IN_PROGRESS holatda ko'rinadi
- Bosilganda `window.confirm()`, so'ng `DELETE` so'rovi
- Omborga avtomatik qaytaradi

---

## 2. Moliyaviy ustunlar precision oshirildi
**Commit:** `9a83f84` — feat: increase financial column precision for better accuracy

### Sabab
`qty × price` da katta sonlar `NUMERIC(14,2)` dan oshib ketib 500 xato berardi (masalan: 42342 × 43242523 ≈ 1.83 trillion > 1 trillion limit)

### O'zgarishlar
- Migration `032`: `warehouse_items.total_value` → `NUMERIC(20,2)`, `warehouse_transactions.total_cost` → `NUMERIC(20,2)`, `warehouse_transactions.unit_price` → `NUMERIC(16,2)`, `financial_logs.amount` → `NUMERIC(20,2)`
- Entity annotatsiyalari yangilandi: `WarehouseItemEntity`, `WarehouseTransactionEntity`, `FinancialLogEntity`

---

## 3. Worker mobil login muammosi va ombor holat badge'lari
**Commit:** `fee070b` / oldingi sessiya ishlari

### Bug fix — Worker 403 loop
- **Sabab:** `CheckInPage` da `furnitureApi.orders.getAll` (OWNER-only) chaqirilardi → 403 → axiosInterceptor `logout()` → redirect `/login`
- **Tuzatish 1:** `CheckInPage` dan orders API chaqiruvini olib tashlandi
- **Tuzatish 2:** `axiosInstance.ts` — 403 da faqat "block" xabari bo'lsa logout, aks holda o'tkazib yuborish

### Ombor salbiy holat
- `quantity < 0` bo'lsa → "Yetishmaydi" (qizil badge), miqdor ham qizil
- `quantity < 0` → `itemCardNeg` (mobil kartada qizil chegara)
- Header'da "⚠ N ta yetishmaydi" hisoblagich

---

## 4. insufficient.stock tekshiruvi olib tashlandi
**Commit:** `9a83f84` ichida

### O'zgarish
`FurnitureOrderServiceImpl.addMaterialUsage` dan stock tekshiruvi olib tashlandi:
```java
// OLIB TASHLANDI:
if (item.getQuantity().compareTo(qty) < 0) {
    throw ApiException.badRequest("insufficient.stock");
}
```
Endi buyurtmaga material qo'shilganda ombor salbiy qiymatga tushishi mumkin — bu ataylab ruxsat etilgan.
