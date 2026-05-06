package project.mebel.financiallog.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class FinancialLogSummaryResponse {
    private String period;           // "2026-04" formatida
    private BigDecimal totalIncome;
    private BigDecimal totalExpense; // musbat qiymat (abs)
    private BigDecimal netAmount;    // income - expense
    private int count;
}
