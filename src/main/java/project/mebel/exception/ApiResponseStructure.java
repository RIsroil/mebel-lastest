package project.mebel.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponseStructure<T> {
    private boolean success;
    private String message;
    private T data;
}
