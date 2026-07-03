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
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriesController(AppDbContext db) => _db = db;

    private int GetUserId() =>
        int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = GetUserId();
        var cats = await _db.Categories.Where(c => c.UserId == userId).OrderBy(c => c.Type).ThenBy(c => c.Name).ToListAsync();
        return Ok(cats.Select(c => new CategoryDto(c.Id, c.Name, c.Icon, c.Color, c.Type, c.IsDefault)));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryDto dto)
    {
        var userId = GetUserId();
        var cat = new Category { UserId = userId, Name = dto.Name, Icon = dto.Icon, Color = dto.Color, Type = dto.Type };
        _db.Categories.Add(cat);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new CategoryDto(cat.Id, cat.Name, cat.Icon, cat.Color, cat.Type, cat.IsDefault));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCategoryDto dto)
    {
        var userId = GetUserId();
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cat == null) return NotFound();
        if (dto.Name != null) cat.Name = dto.Name;
        if (dto.Icon != null) cat.Icon = dto.Icon;
        if (dto.Color != null) cat.Color = dto.Color;
        await _db.SaveChangesAsync();
        return Ok(new CategoryDto(cat.Id, cat.Name, cat.Icon, cat.Color, cat.Type, cat.IsDefault));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetUserId();
        var cat = await _db.Categories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);
        if (cat == null) return NotFound();
        if (cat.IsDefault) return BadRequest(new { message = "Cannot delete default categories" });
        _db.Categories.Remove(cat);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
