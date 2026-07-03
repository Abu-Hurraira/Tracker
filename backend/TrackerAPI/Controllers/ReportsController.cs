using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackerAPI.Data;
using TrackerAPI.DTOs;

namespace TrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ReportsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var userId = GetUserId();
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;

        var transactions = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= fromDate && t.Date <= toDate)
            .ToListAsync();

        var totalExpense = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);
        var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);

        var dailyTotals = transactions
            .GroupBy(t => t.Date.Date)
            .OrderBy(g => g.Key)
            .Select(g => new DailyTotalDto(
                g.Key,
                g.Where(t => t.Type == "expense").Sum(t => t.Amount),
                g.Where(t => t.Type == "income").Sum(t => t.Amount)
            )).ToList();

        var categoryBreakdown = transactions
            .Where(t => t.Type == "expense" && t.Category != null)
            .GroupBy(t => t.CategoryId)
            .Select(g => {
                var cat = g.First().Category!;
                var amt = g.Sum(t => t.Amount);
                return new CategorySpendingDto(
                    new CategoryDto(cat.Id, cat.Name, cat.Icon, cat.Color, cat.Type, cat.IsDefault),
                    amt,
                    totalExpense > 0 ? Math.Round((amt / totalExpense) * 100, 1) : 0,
                    g.Count()
                );
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return Ok(new SummaryDto(totalExpense, totalIncome, totalIncome - totalExpense, transactions.Count, dailyTotals, categoryBreakdown));
    }

    [HttpGet("monthly-history")]
    public async Task<IActionResult> GetMonthlyHistory([FromQuery] int months = 12)
    {
        var userId = GetUserId();
        var fromDate = DateTime.UtcNow.AddMonths(-months + 1).Date;
        fromDate = new DateTime(fromDate.Year, fromDate.Month, 1);

        var transactions = await _db.Transactions
            .Where(t => t.UserId == userId && t.Date >= fromDate)
            .ToListAsync();

        var history = transactions
            .GroupBy(t => new { t.Date.Year, t.Date.Month })
            .OrderByDescending(g => g.Key.Year).ThenByDescending(g => g.Key.Month)
            .Select(g => new MonthlyHistoryDto(
                g.Key.Year, g.Key.Month,
                g.Where(t => t.Type == "expense").Sum(t => t.Amount),
                g.Where(t => t.Type == "income").Sum(t => t.Amount),
                g.Where(t => t.Type == "income").Sum(t => t.Amount) - g.Where(t => t.Type == "expense").Sum(t => t.Amount)
            )).ToList();

        return Ok(history);
    }

    [HttpGet("category-breakdown")]
    public async Task<IActionResult> GetCategoryBreakdown([FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] string type = "expense")
    {
        var userId = GetUserId();
        var fromDate = from ?? new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var toDate = to ?? DateTime.UtcNow;

        var transactions = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Type == type && t.Date >= fromDate && t.Date <= toDate && t.Category != null)
            .ToListAsync();

        var total = transactions.Sum(t => t.Amount);
        var breakdown = transactions
            .GroupBy(t => t.CategoryId)
            .Select(g => {
                var cat = g.First().Category!;
                var amt = g.Sum(t => t.Amount);
                return new CategorySpendingDto(
                    new CategoryDto(cat.Id, cat.Name, cat.Icon, cat.Color, cat.Type, cat.IsDefault),
                    amt,
                    total > 0 ? Math.Round((amt / total) * 100, 1) : 0,
                    g.Count()
                );
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        return Ok(breakdown);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = GetUserId();
        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        var thisMonthTx = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= startOfMonth)
            .OrderByDescending(t => t.Date).ToListAsync();

        var totalExpense = thisMonthTx.Where(t => t.Type == "expense").Sum(t => t.Amount);
        var totalIncome = thisMonthTx.Where(t => t.Type == "income").Sum(t => t.Amount);

        var recentTx = thisMonthTx.Take(5).Select(t => new {
            t.Id, t.Title, t.Amount, t.Type, t.Note, t.Date,
            Category = t.Category == null ? null : new { t.Category.Name, t.Category.Icon, t.Category.Color }
        });

        var accounts = await _db.Accounts.Where(a => a.UserId == userId).ToListAsync();
        var totalBalance = accounts.Sum(a => a.Balance);

        // Active budgets: where today is within start–end range
        var activeBudgetTotal = await _db.Budgets
            .Where(b => b.UserId == userId && b.StartDate <= now && b.EndDate >= now)
            .SumAsync(b => (decimal?)b.Amount) ?? 0;

        return Ok(new {
            ThisMonth = new { Expense = totalExpense, Income = totalIncome, Net = totalIncome - totalExpense, TransactionCount = thisMonthTx.Count },
            TotalBalance = totalBalance,
            ActiveBudgetTotal = activeBudgetTotal,
            RecentTransactions = recentTx,
            Accounts = accounts.Select(a => new { a.Id, a.Name, a.Type, a.Icon, a.Color, a.Balance })
        });
    }
}
