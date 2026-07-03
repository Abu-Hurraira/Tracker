using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TrackerAPI.Models;

public class Budget
{
    public int Id { get; set; }
    [Required]
    public int UserId { get; set; }
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
    [Required]
    public decimal Amount { get; set; }
    [Required]
    public DateTime StartDate { get; set; }
    [Required]
    public DateTime EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
    public ICollection<BudgetCategory> BudgetCategories { get; set; } = new List<BudgetCategory>();
}
