using System.ComponentModel.DataAnnotations;

namespace TrackerAPI.Models;

public class User
{
    public int Id { get; set; }
    [Required, MaxLength(100)]
    public string Username { get; set; } = string.Empty;
    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string PasswordHash { get; set; } = string.Empty;
    [MaxLength(10)]
    public string Currency { get; set; } = "PKR";
    public string CurrencySymbol { get; set; } = "Rs";
    public string? AvatarColor { get; set; } = "#6C63FF";
    public string Theme { get; set; } = "light";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    public ICollection<Budget> Budgets { get; set; } = new List<Budget>();
}
