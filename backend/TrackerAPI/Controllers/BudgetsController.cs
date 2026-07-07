using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackerAPI.Data;
using TrackerAPI.DTOs;
using TrackerAPI.Models;

namespace TrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BudgetsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BudgetsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var budgets = await _db.Budgets
            .Include(b => b.BudgetCategories).ThenInclude(bc => bc.Category)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.StartDate)
            .ToListAsync();
        return Ok(budgets.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = GetUserId();
        var budget = await _db.Budgets.Include(b => b.BudgetCategories).ThenInclude(bc => bc.Category)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget == null) return NotFound();
        return Ok(MapToDto(budget));
    }

    [HttpGet("spending-summary")]
    public async Task<IActionResult> GetAllSpending()
    {
        var userId = GetUserId();
        var budgets = await _db.Budgets
            .Include(b => b.BudgetCategories)
            .Where(b => b.UserId == userId)
            .ToListAsync();

        if (budgets.Count == 0)
            return Ok(new Dictionary<int, BudgetSpendingSummaryDto>());

        var minDate = budgets.Min(b => b.StartDate);
        var maxDate = budgets.Max(b => b.EndDate);
        var today = DateTime.UtcNow.Date;

        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && t.Type == "expense"
                && t.Date >= minDate && t.Date <= maxDate)
            .ToListAsync();

        var result = new Dictionary<int, BudgetSpendingSummaryDto>();
        foreach (var budget in budgets)
        {
            var categoryIds = budget.BudgetCategories.Select(bc => bc.CategoryId).ToHashSet();
            var budgetTx = transactions.Where(t =>
                t.Date >= budget.StartDate && t.Date <= budget.EndDate
                && (categoryIds.Count == 0 || (t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value))));

            var totalSpent = budgetTx.Sum(t => t.Amount);
            var remaining = budget.Amount - totalSpent;
            var percentUsed = budget.Amount > 0 ? (totalSpent / budget.Amount) * 100 : 0;
            var daysRemaining = Math.Max(0, (budget.EndDate.Date - today).Days);
            var dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

            result[budget.Id] = new BudgetSpendingSummaryDto(
                totalSpent,
                remaining,
                Math.Round(percentUsed, 1),
                Math.Round(dailyAllowance, 2),
                daysRemaining
            );
        }

        return Ok(result);
    }

    [HttpGet("{id}/spending")]
    public async Task<IActionResult> GetSpending(int id)
    {
        var userId = GetUserId();
        var budget = await _db.Budgets.Include(b => b.BudgetCategories).ThenInclude(bc => bc.Category)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget == null) return NotFound();

        var categoryIds = budget.BudgetCategories.Select(bc => bc.CategoryId).ToList();

        var transactions = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Type == "expense"
                && t.Date >= budget.StartDate && t.Date <= budget.EndDate
                && (categoryIds.Count == 0 || categoryIds.Contains(t.CategoryId ?? 0)))
            .ToListAsync();

        var totalSpent = transactions.Sum(t => t.Amount);
        var remaining = budget.Amount - totalSpent;
        var percentUsed = budget.Amount > 0 ? (totalSpent / budget.Amount) * 100 : 0;

        var today = DateTime.UtcNow.Date;
        var daysRemaining = Math.Max(0, (budget.EndDate.Date - today).Days);
        var dailyAllowance = daysRemaining > 0 ? remaining / daysRemaining : 0;

        var categoryBreakdown = transactions
            .GroupBy(t => t.CategoryId)
            .Select(g => {
                var cat = g.First().Category;
                var amount = g.Sum(t => t.Amount);
                return new CategorySpendingDto(
                    cat == null ? null! : new CategoryDto(cat.Id, cat.Name, cat.Icon, cat.Color, cat.Type, cat.IsDefault),
                    amount,
                    totalSpent > 0 ? Math.Round((amount / totalSpent) * 100, 1) : 0,
                    g.Count()
                );
            })
            .Where(c => c.Category != null)
            .OrderByDescending(c => c.Amount)
            .ToList();

        return Ok(new BudgetSpendingDto(
            MapToDto(budget),
            totalSpent,
            remaining,
            Math.Round(percentUsed, 1),
            Math.Round(dailyAllowance, 2),
            daysRemaining,
            categoryBreakdown
        ));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBudgetDto dto)
    {
        var userId = GetUserId();
        var budget = new Budget
        {
            UserId = userId,
            Name = dto.Name,
            Amount = dto.Amount,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate
        };
        _db.Budgets.Add(budget);
        await _db.SaveChangesAsync();

        if (dto.CategoryIds.Count > 0)
        {
            budget.BudgetCategories = dto.CategoryIds.Select(cid => new BudgetCategory { BudgetId = budget.Id, CategoryId = cid }).ToList();
            await _db.SaveChangesAsync();
        }

        var created = await _db.Budgets.Include(b => b.BudgetCategories).ThenInclude(bc => bc.Category).FirstAsync(b => b.Id == budget.Id);
        return CreatedAtAction(nameof(Get), new { id = budget.Id }, MapToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBudgetDto dto)
    {
        var userId = GetUserId();
        var budget = await _db.Budgets.Include(b => b.BudgetCategories)
            .FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget == null) return NotFound();

        if (dto.Name != null) budget.Name = dto.Name;
        if (dto.Amount.HasValue) budget.Amount = dto.Amount.Value;
        if (dto.StartDate.HasValue) budget.StartDate = dto.StartDate.Value;
        if (dto.EndDate.HasValue) budget.EndDate = dto.EndDate.Value;

        if (dto.CategoryIds != null)
        {
            budget.BudgetCategories.Clear();
            budget.BudgetCategories = dto.CategoryIds.Select(cid => new BudgetCategory { BudgetId = id, CategoryId = cid }).ToList();
        }

        await _db.SaveChangesAsync();
        var updated = await _db.Budgets.Include(b => b.BudgetCategories).ThenInclude(bc => bc.Category).FirstAsync(b => b.Id == id);
        return Ok(MapToDto(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var budget = await _db.Budgets.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
        if (budget == null) return NotFound();
        _db.Budgets.Remove(budget);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static BudgetDto MapToDto(Budget b) => new(
        b.Id, b.Name, b.Amount, b.StartDate, b.EndDate,
        b.BudgetCategories.Select(bc => new CategoryDto(bc.Category.Id, bc.Category.Name, bc.Category.Icon, bc.Category.Color, bc.Category.Type, bc.Category.IsDefault)).ToList()
    );
}
