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
public class TransactionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TransactionsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? month, [FromQuery] int? year)
    {
        var userId = GetUserId();
        var query = _db.Transactions
            .Include(t => t.Category)
            .Include(t => t.Account)
            .Where(t => t.UserId == userId);

        if (month.HasValue && year.HasValue)
            query = query.Where(t => t.Date.Month == month && t.Date.Year == year);
        else if (year.HasValue)
            query = query.Where(t => t.Date.Year == year);

        var transactions = await query.OrderByDescending(t => t.Date).ThenByDescending(t => t.CreatedAt).ToListAsync();
        return Ok(transactions.Select(MapToDto));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var userId = GetUserId();
        var t = await _db.Transactions.Include(t => t.Category).Include(t => t.Account)
            .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (t == null) return NotFound();
        return Ok(MapToDto(t));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTransactionDto dto)
    {
        var userId = GetUserId();

        var transaction = new Transaction
        {
            UserId = userId,
            Title = dto.Title,
            Amount = dto.Amount,
            Type = dto.Type,
            Note = dto.Note,
            Date = dto.Date,
            CategoryId = dto.CategoryId,
            AccountId = dto.AccountId
        };

        // Update account balance
        if (dto.AccountId.HasValue)
        {
            var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.UserId == userId);
            if (account != null)
                account.Balance += dto.Type == "income" ? dto.Amount : -dto.Amount;
        }

        _db.Transactions.Add(transaction);
        await _db.SaveChangesAsync();

        var created = await _db.Transactions.Include(t => t.Category).Include(t => t.Account)
            .FirstAsync(t => t.Id == transaction.Id);
        return CreatedAtAction(nameof(Get), new { id = transaction.Id }, MapToDto(created));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTransactionDto dto)
    {
        var userId = GetUserId();
        var transaction = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (transaction == null) return NotFound();

        // Revert old account balance
        if (transaction.AccountId.HasValue)
        {
            var oldAccount = await _db.Accounts.FindAsync(transaction.AccountId);
            if (oldAccount != null)
                oldAccount.Balance -= transaction.Type == "income" ? transaction.Amount : -transaction.Amount;
        }

        if (dto.Title != null) transaction.Title = dto.Title;
        if (dto.Amount.HasValue) transaction.Amount = dto.Amount.Value;
        if (dto.Type != null) transaction.Type = dto.Type;
        if (dto.Note != null) transaction.Note = dto.Note;
        if (dto.Date.HasValue) transaction.Date = dto.Date.Value;
        if (dto.CategoryId != null) transaction.CategoryId = dto.CategoryId;
        if (dto.AccountId != null) transaction.AccountId = dto.AccountId;

        // Apply new account balance
        if (transaction.AccountId.HasValue)
        {
            var newAccount = await _db.Accounts.FindAsync(transaction.AccountId);
            if (newAccount != null)
                newAccount.Balance += transaction.Type == "income" ? transaction.Amount : -transaction.Amount;
        }

        await _db.SaveChangesAsync();
        var updated = await _db.Transactions.Include(t => t.Category).Include(t => t.Account)
            .FirstAsync(t => t.Id == id);
        return Ok(MapToDto(updated));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var transaction = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (transaction == null) return NotFound();

        // Revert account balance
        if (transaction.AccountId.HasValue)
        {
            var account = await _db.Accounts.FindAsync(transaction.AccountId);
            if (account != null)
                account.Balance -= transaction.Type == "income" ? transaction.Amount : -transaction.Amount;
        }

        _db.Transactions.Remove(transaction);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static TransactionDto MapToDto(Transaction t) => new(
        t.Id, t.Title, t.Amount, t.Type, t.Note, t.Date,
        t.Category == null ? null : new CategoryDto(t.Category.Id, t.Category.Name, t.Category.Icon, t.Category.Color, t.Category.Type, t.Category.IsDefault),
        t.Account == null ? null : new AccountDto(t.Account.Id, t.Account.Name, t.Account.Type, t.Account.Icon, t.Account.Color, t.Account.Balance)
    );
}
