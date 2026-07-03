using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackerAPI.Models;

public class Account
{
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "bank"; // bank | cash | card
    public string Icon { get; set; } = "🏦";
    public string Color { get; set; } = "#6C63FF";
    public decimal Balance { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
