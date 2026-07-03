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
        var accounts = await _db.Accounts.Where(a => a.UserId == userId).OrderBy(a => a.Name).ToListAsync();
        return Ok(accounts.Select(MapToDto));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAccountDto dto)
    {
        var userId = GetUserId();
        var account = new Account { UserId = userId, Name = dto.Name, Type = dto.Type, Icon = dto.Icon, Color = dto.Color, Balance = dto.Balance };
        _db.Accounts.Add(account);
        await _db.SaveChangesAsync();
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
        if (dto.Balance.HasValue) account.Balance = dto.Balance.Value;
        await _db.SaveChangesAsync();
        return Ok(MapToDto(account));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var account = await _db.Accounts.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId);
        if (account == null) return NotFound();
        _db.Accounts.Remove(account);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static AccountDto MapToDto(Account a) => new(a.Id, a.Name, a.Type, a.Icon, a.Color, a.Balance);
}
