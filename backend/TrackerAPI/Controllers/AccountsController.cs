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
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AccountsController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var accounts = await _db.Accounts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.IsMain)
            .ThenBy(a => a.Name)
            .ToListAsync();
        return Ok(accounts.Select(MapToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountDto dto)
    {
        var userId = GetUserId();

        if (dto.IsMain)
        {
            var hasMain = await _db.Accounts.AnyAsync(a => a.UserId == userId && a.IsMain);
            if (hasMain)
                return BadRequest(new { message = "You already have a main savings account." });
        }

        var initialDeposit = dto.IsMain ? Math.Max(0, dto.Balance) : 0;
        var account = new Account
        {
            UserId = userId,
            Name = dto.Name,
            Type = dto.IsMain ? "main" : dto.Type,
            Icon = dto.Icon,
            Color = dto.Color,
            Balance = dto.Balance,
            IsMain = dto.IsMain,
            InitialDeposit = initialDeposit
        };
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();

        // Initial deposit is stored on the account (InitialDeposit) and counted in Income
        // on the dashboard — not as a transaction. Shown via notifications instead.

        return CreatedAtAction(nameof(GetAll), MapToDto(account));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAccountDto dto)
    {
        var userId = GetUserId();
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (account == null) return NotFound();
        if (dto.Name != null) account.Name = dto.Name;
        if (dto.Icon != null) account.Icon = dto.Icon;
        if (dto.Color != null) account.Color = dto.Color;
        // Main balance is changed via transfer / create only — ignore direct balance edits
        if (dto.Balance.HasValue && !account.IsMain)
            account.Balance = dto.Balance.Value;
        await _db.SaveChangesAsync();
        return Ok(MapToDto(account));
    }

    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> Transfer(int id, [FromBody] TransferFundsDto dto)
    {
        var userId = GetUserId();
        if (dto.Amount <= 0)
            return BadRequest(new { message = "Transfer amount must be greater than zero." });

        var from = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (from == null) return NotFound(new { message = "Source account not found." });
        if (!from.IsMain)
            return BadRequest(new { message = "Only the main savings account can transfer funds." });

        var to = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == dto.ToAccountId && a.UserId == userId);
        if (to == null) return NotFound(new { message = "Destination account not found." });
        if (to.IsMain)
            return BadRequest(new { message = "Cannot transfer to the main savings account." });
        if (from.Id == to.Id)
            return BadRequest(new { message = "Cannot transfer to the same account." });
        if (from.Balance < dto.Amount)
            return BadRequest(new { message = "Insufficient main account balance." });

        from.Balance -= dto.Amount;
        to.Balance += dto.Amount;

        // Transfer records are type "transfer" — excluded from income/expense totals
        var now = DateTime.UtcNow;
        _db.Transactions.Add(new Transaction
        {
            UserId = userId,
            Title = $"Transfer to {to.Name}",
            Amount = dto.Amount,
            Type = "transfer",
            Note = $"from-main:{from.Id}",
            Date = now,
            AccountId = from.Id
        });
        _db.Transactions.Add(new Transaction
        {
            UserId = userId,
            Title = $"Transfer from {from.Name}",
            Amount = dto.Amount,
            Type = "transfer",
            Note = $"to-account:{to.Id}",
            Date = now,
            AccountId = to.Id
        });

        await _db.SaveChangesAsync();

        return Ok(new
        {
            From = MapToDto(from),
            To = MapToDto(to),
            Amount = dto.Amount
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (account == null) return NotFound();

        // FK is NoAction — unlink/remove transactions that reference this account
        var linked = await _db.Transactions
            .Where(t => t.UserId == userId && t.AccountId == id)
            .ToListAsync();

        foreach (var t in linked)
        {
            if (t.Type == "transfer")
                _db.Transactions.Remove(t);
            else
                t.AccountId = null;
        }

        if (account.IsMain)
        {
            // Remove any legacy seed-income rows if they still exist
            var deposits = await _db.Transactions
                .Where(t => t.UserId == userId && t.Note == "main-initial-deposit")
                .ToListAsync();
            _db.Transactions.RemoveRange(deposits);

            var fromLegs = await _db.Transactions
                .Where(t => t.UserId == userId && t.Note == $"from-main:{id}")
                .ToListAsync();
            foreach (var leg in fromLegs)
            {
                var toLegs = await _db.Transactions
                    .Where(t => t.UserId == userId && t.Type == "transfer"
                        && t.Note != null && t.Note.StartsWith("to-account:")
                        && t.Amount == leg.Amount && t.Date == leg.Date)
                    .ToListAsync();
                _db.Transactions.RemoveRange(toLegs);
                _db.Transactions.Remove(leg);
            }
        }

        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static AccountDto MapToDto(Account a) =>
        new(a.Id, a.Name, a.Type, a.Icon, a.Color, a.Balance, a.IsMain, a.InitialDeposit);
}
