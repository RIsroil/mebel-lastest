package project.mebel.attendance.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualEntryRequest {

    @NotNull
    private LocalDate date;

    @NotNull
    private LocalTime checkInTime;

    @NotNull
    private LocalTime checkOutTime;

    private String notes;
}
