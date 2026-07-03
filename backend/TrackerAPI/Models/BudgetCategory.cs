using System.ComponentModel.DataAnnotations.Schema;

namespace TrackerAPI.Models;

public class BudgetCategory
{
    public int BudgetId { get; set; }
    public int CategoryId { get; set; }

    [ForeignKey("BudgetId")]
    public Budget Budget { get; set; } = null!;
    [ForeignKey("CategoryId")]
    public Category Category { get; set; } = null!;
}
