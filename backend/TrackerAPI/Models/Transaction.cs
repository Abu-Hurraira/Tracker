using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackerAPI.Models;

public class Transaction
{
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    public int? CategoryId { get; set; }
    public int? AccountId { get; set; }
    [MaxLength(200)]
    public string? Title { get; set; }
    [Required]
    public decimal Amount { get; set; }
    [Required]
    public string Type { get; set; } = "expense"; // expense | income
    public string? Note { get; set; }
    [Required]
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    [ForeignKey("CategoryId")]
    public Category? Category { get; set; }
    [ForeignKey("AccountId")]
    public Account? Account { get; set; }
}
