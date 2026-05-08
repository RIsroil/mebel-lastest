package project.mebel.workshop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.mebel.common.enums.AttendanceMode;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkshopResponse {
    private UUID id;
    private String name;
    private String address;
    private String phone;
    private String description;
    private boolean active;
    private UUID ownerId;
    private AttendanceMode attendanceMode;
    private LocalDateTime createdAt;
}
