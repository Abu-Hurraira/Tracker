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

    private async Task<(decimal Total, decimal Spent, decimal Remaining)> GetActiveBudgetStatsAsync(int userId, DateTime now)
    {
        var activeBudgets = await _db.Budgets
            .Include(b => b.BudgetCategories)
            .Where(b => b.UserId == userId && b.StartDate <= now && b.EndDate >= now)
            .ToListAsync();

        if (activeBudgets.Count == 0)
            return (0, 0, 0);

        var total = activeBudgets.Sum(b => b.Amount);
        var minDate = activeBudgets.Min(b => b.StartDate);
        var maxDate = activeBudgets.Max(b => b.EndDate);

        var expenses = await _db.Transactions
            .Where(t => t.UserId == userId && t.Type == "expense"
                && t.Date >= minDate && t.Date <= maxDate)
            .ToListAsync();

        decimal spent = 0;
        foreach (var budget in activeBudgets)
        {
            var categoryIds = budget.BudgetCategories.Select(bc => bc.CategoryId).ToHashSet();
            spent += expenses
                .Where(t => t.Date >= budget.StartDate && t.Date <= budget.EndDate
                    && (categoryIds.Count == 0 || (t.CategoryId.HasValue && categoryIds.Contains(t.CategoryId.Value))))
                .Sum(t => t.Amount);
        }

        return (total, spent, total - spent);
    }

    private async Task CleanupLegacyMainDepositTransactionsAsync(int userId)
    {
        // Old design created "Main account deposit" income txs — remove them everywhere.
        // Income now comes from Account.InitialDeposit while the main account exists.
        var legacy = await _db.Transactions
            .Where(t => t.UserId == userId && t.Note == "main-initial-deposit")
            .ToListAsync();
        if (legacy.Count == 0) return;
        _db.Transactions.RemoveRange(legacy);
        await _db.SaveChangesAsync();
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var userId = GetUserId();
        var fromDate = from ?? DateTime.UtcNow.AddMonths(-1);
        var toDate = to ?? DateTime.UtcNow;
        var now = DateTime.UtcNow;

        await CleanupLegacyMainDepositTransactionsAsync(userId);

        var transactions = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= fromDate && t.Date <= toDate
                && t.Note != "main-initial-deposit")
            .ToListAsync();

        var totalExpense = transactions.Where(t => t.Type == "expense").Sum(t => t.Amount);
        var totalIncome = transactions.Where(t => t.Type == "income").Sum(t => t.Amount);

        var accounts = await _db.Accounts.Where(a => a.UserId == userId).ToListAsync();
        var spendingAccounts = accounts.Where(a => !a.IsMain).ToList();
        var main = accounts.FirstOrDefault(a => a.IsMain);
        // Count main initial deposit in income while main account exists (not as a transaction)
        if (main != null && main.InitialDeposit > 0)
            totalIncome += main.InitialDeposit;

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

        var (budgetTotal, budgetSpent, budgetRemaining) = await GetActiveBudgetStatsAsync(userId, now);

        return Ok(new SummaryDto(
            totalExpense,
            totalIncome,
            totalIncome - totalExpense,
            transactions.Count(t => t.Type == "expense" || t.Type == "income"),
            dailyTotals,
            categoryBreakdown,
            spendingAccounts.Sum(a => a.Balance),
            budgetTotal,
            budgetRemaining,
            budgetSpent,
            spendingAccounts.Count,
            main?.Balance ?? 0,
            main?.InitialDeposit ?? 0
        ));
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

        await CleanupLegacyMainDepositTransactionsAsync(userId);

        var accounts = await _db.Accounts.Where(a => a.UserId == userId).ToListAsync();
        var spendingAccounts = accounts.Where(a => !a.IsMain).ToList();
        var mainAccount = accounts.FirstOrDefault(a => a.IsMain);

        // DbContext is not thread-safe — run queries sequentially
        var monthStats = await _db.Transactions
            .Where(t => t.UserId == userId && t.Date >= startOfMonth
                && (t.Type == "expense" || t.Type == "income")
                && t.Note != "main-initial-deposit")
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Expense = g.Where(t => t.Type == "expense").Sum(t => (decimal?)t.Amount) ?? 0,
                Income = g.Where(t => t.Type == "income").Sum(t => (decimal?)t.Amount) ?? 0,
                Count = g.Count()
            })
            .FirstOrDefaultAsync() ?? new { Expense = 0m, Income = 0m, Count = 0 };

        var income = monthStats.Income;
        if (mainAccount != null && mainAccount.InitialDeposit > 0)
            income += mainAccount.InitialDeposit;

        // Net on Income card: when a main account exists, track only transfers out of main
        // (InitialDeposit − remaining balance). Regular expenses do not affect this Net.
        decimal net;
        decimal? transferredFromMain = null;
        if (mainAccount != null)
        {
            transferredFromMain = Math.Max(0, mainAccount.InitialDeposit - mainAccount.Balance);
            net = mainAccount.Balance;
        }
        else
        {
            net = income - monthStats.Expense;
        }

        var recentTx = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.Date >= startOfMonth
                && t.Note != "main-initial-deposit")
            .OrderByDescending(t => t.Date)
            .Take(7)
            .Select(t => new {
                t.Id, t.Title, t.Amount, t.Type, t.Note, t.Date,
                Category = t.Category == null ? null : new { t.Category.Name, t.Category.Icon, t.Category.Color }
            })
            .ToListAsync();

        var (activeBudgetTotal, activeBudgetSpent, activeBudgetRemaining) = await GetActiveBudgetStatsAsync(userId, now);

        return Ok(new {
            ThisMonth = new {
                Expense = monthStats.Expense,
                Income = income,
                Net = net,
                TransactionCount = monthStats.Count,
                NetFromMainTransfers = mainAccount != null,
                TransferredFromMain = transferredFromMain
            },
            TotalBalance = spendingAccounts.Sum(a => a.Balance),
            ActiveBudgetTotal = activeBudgetTotal,
            ActiveBudgetSpent = activeBudgetSpent,
            ActiveBudgetRemaining = activeBudgetRemaining,
            RecentTransactions = recentTx,
            Accounts = spendingAccounts.Select(a => new { a.Id, a.Name, a.Type, a.Icon, a.Color, a.Balance, a.IsMain }),
            MainAccount = mainAccount == null ? null : new {
                mainAccount.Id, mainAccount.Name, mainAccount.Type, mainAccount.Icon, mainAccount.Color,
                mainAccount.Balance, mainAccount.IsMain, mainAccount.InitialDeposit
            }
        });
    }
}
