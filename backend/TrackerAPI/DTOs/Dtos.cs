namespace TrackerAPI.DTOs;

// Auth
public record RegisterDto(string Username, string Email, string Password);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, UserDto User);

// User
public record UserDto(int Id, string Username, string Email, string Currency, string CurrencySymbol, string? AvatarColor, string Theme, DateTime CreatedAt);
public record UpdateProfileDto(string? Username, string? Currency, string? CurrencySymbol, string? AvatarColor, string? Theme);
public record ChangePasswordDto(string CurrentPassword, string NewPassword);

// Category
public record CategoryDto(int Id, string Name, string Icon, string Color, string Type, bool IsDefault);
public record CreateCategoryDto(string Name, string Icon, string Color, string Type);
public record UpdateCategoryDto(string? Name, string? Icon, string? Color);

// Account
public record AccountDto(int Id, string Name, string Type, string Icon, string Color, decimal Balance);
public record CreateAccountDto(string Name, string Type, string Icon, string Color, decimal Balance);
public record UpdateAccountDto(string? Name, string? Icon, string? Color, decimal? Balance);

// Transaction
public record TransactionDto(
    int Id,
    string? Title,
    decimal Amount,
    string Type,
    string? Note,
    DateTime Date,
    CategoryDto? Category,
    AccountDto? Account
);
public record CreateTransactionDto(
    string? Title,
    decimal Amount,
    string Type,
    string? Note,
    DateTime Date,
    int? CategoryId,
    int? AccountId
);
public record UpdateTransactionDto(
    string? Title,
    decimal? Amount,
    string? Type,
    string? Note,
    DateTime? Date,
    int? CategoryId,
    int? AccountId
);

// Budget
public record BudgetDto(int Id, string Name, decimal Amount, DateTime StartDate, DateTime EndDate, List<CategoryDto> Categories);
public record CreateBudgetDto(string Name, decimal Amount, DateTime StartDate, DateTime EndDate, List<int> CategoryIds);
public record UpdateBudgetDto(string? Name, decimal? Amount, DateTime? StartDate, DateTime? EndDate, List<int>? CategoryIds);
public record BudgetSpendingDto(
    BudgetDto Budget,
    decimal Spent,
    decimal Remaining,
    decimal PercentUsed,
    decimal DailyAllowance,
    int DaysRemaining,
    List<CategorySpendingDto> CategoryBreakdown
);

// Reports
public record SummaryDto(
    decimal TotalExpense,
    decimal TotalIncome,
    decimal NetTotal,
    int TransactionCount,
    List<DailyTotalDto> DailyTotals,
    List<CategorySpendingDto> CategoryBreakdown
);
public record DailyTotalDto(DateTime Date, decimal Expense, decimal Income);
public record CategorySpendingDto(CategoryDto Category, decimal Amount, decimal Percentage, int Count);
public record MonthlyHistoryDto(int Year, int Month, decimal Expense, decimal Income, decimal Net);
