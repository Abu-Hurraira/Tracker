using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TrackerAPI.Data;
using TrackerAPI.DTOs;
using TrackerAPI.Models;
using TrackerAPI.Services;

namespace TrackerAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;

    public AuthController(AppDbContext db, IJwtService jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already exists" });

        var user = new User
        {
            Username = dto.Username,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        // Seed default categories
        var defaultCategories = GetDefaultCategories(user.Id);
        _db.Categories.AddRange(defaultCategories);

        // Seed default account
        _db.Accounts.Add(new Account { UserId = user.Id, Name = "Cash", Type = "cash", Icon = "💵", Color = "#4CAF7D" });

        await _db.SaveChangesAsync();

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, ToDto(user)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password" });

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, ToDto(user)));
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        return Ok(ToDto(user));
    }

    [HttpPut("profile")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (dto.Username != null) user.Username = dto.Username;
        if (dto.Currency != null) user.Currency = dto.Currency;
        if (dto.CurrencySymbol != null) user.CurrencySymbol = dto.CurrencySymbol;
        if (dto.AvatarColor != null) user.AvatarColor = dto.AvatarColor;
        if (dto.Theme != null) user.Theme = dto.Theme;
        if (dto.ProfilePicture != null) user.ProfilePicture = dto.ProfilePicture == "" ? null : dto.ProfilePicture;

        await _db.SaveChangesAsync();
        return Ok(ToDto(user));
    }

    [HttpPut("change-password")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = GetUserId();
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return NotFound();
        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Password changed successfully" });
    }

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    private static UserDto ToDto(User u) =>
        new(u.Id, u.Username, u.Email, u.Currency, u.CurrencySymbol, u.AvatarColor, u.Theme, u.CreatedAt, u.ProfilePicture);

    private static List<Category> GetDefaultCategories(int userId) => new()
    {
        new Category { UserId = userId, Name = "Food & Dining", Icon = "🍔", Color = "#FF6B6B", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Groceries", Icon = "🛒", Color = "#4CAF7D", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Rent & Housing", Icon = "🏠", Color = "#FF5722", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Cafe & Coffee", Icon = "☕", Color = "#795548", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Fuel & Gas", Icon = "⛽", Color = "#607D8B", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Utilities & Bills", Icon = "🔌", Color = "#FFC107", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Internet & Phone", Icon = "📶", Color = "#00BCD4", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Transport", Icon = "🚌", Color = "#2196F3", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Shopping", Icon = "🛍️", Color = "#9C27B0", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Bills & Fees", Icon = "📄", Color = "#FF9800", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Health & Meds", Icon = "💊", Color = "#E91E63", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Entertainment", Icon = "🎬", Color = "#3F51B5", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Education", Icon = "📚", Color = "#9C27B0", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Gifts & Donations", Icon = "🎁", Color = "#F44336", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Travel & Trips", Icon = "✈️", Color = "#009688", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Gym & Fitness", Icon = "🏋️", Color = "#4CAF7D", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Insurance", Icon = "🛡️", Color = "#9E9E9E", Type = "expense", IsDefault = true },
        new Category { UserId = userId, Name = "Salary", Icon = "💼", Color = "#4CAF7D", Type = "income", IsDefault = true },
        new Category { UserId = userId, Name = "Freelance", Icon = "💻", Color = "#00BCD4", Type = "income", IsDefault = true },
        new Category { UserId = userId, Name = "Business", Icon = "🏢", Color = "#FF9800", Type = "income", IsDefault = true },
        new Category { UserId = userId, Name = "Investment", Icon = "📈", Color = "#8BC34A", Type = "income", IsDefault = true },
        new Category { UserId = userId, Name = "Dividends", Icon = "🪙", Color = "#FFD700", Type = "income", IsDefault = true },
        new Category { UserId = userId, Name = "Other Income", Icon = "💰", Color = "#607D8B", Type = "income", IsDefault = true },
    };
}
