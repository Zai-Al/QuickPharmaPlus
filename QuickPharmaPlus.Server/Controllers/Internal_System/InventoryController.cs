using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Inventory;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryRepository _repo;

        public InventoryController(IInventoryRepository repo)
        {
            _repo = repo;
        }

        // GET: api/Inventory
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] DateOnly? expiryDate = null)
        {
            // Backend SAFE VALIDATION

            // Validate inventory ID search (must be numeric if numeric input)
            if (!string.IsNullOrWhiteSpace(search))
            {
                // If user is searching by number ensure numeric
                if (search.All(char.IsDigit) == false && Regex.IsMatch(search, @"^\d+$"))
                {
                    ModelState.AddModelError("search", "Inventory ID must contain numbers only.");
                    return BadRequest(ModelState);
                }

                // Validate allowed characters for product search
                // Letters, numbers, spaces, + and -
                if (!Regex.IsMatch(search, @"^[A-Za-z0-9+\- ]*$"))
                {
                    ModelState.AddModelError("search", "Product search may only contain letters, numbers, spaces, + and -.");
                    return BadRequest(ModelState);
                }
            }

            // Validate expiry date sent from UI
            if (expiryDate.HasValue)
            {
                if (expiryDate.Value.Year < 2000 || expiryDate.Value.Year > 2100)
                {
                    ModelState.AddModelError("expiryDate", "Invalid expiry date.");
                    return BadRequest(ModelState);
                }
            }

            var result = await _repo.GetAllInventoriesAsync(pageNumber, pageSize, search, expiryDate);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // GET: api/Inventory/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var inv = await _repo.GetInventoryByIdAsync(id);
            if (inv == null) return NotFound();
            return Ok(inv);
        }

        // PUT: api/Inventory/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Inventory payload)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            payload.InventoryId = id;

            try
            {
                var updated = await _repo.UpdateInventoryAsync(payload);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred." });
            }
        }

        // DELETE: api/Inventory/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var success = await _repo.DeleteInventoryAsync(id);
                if (!success) return NotFound();
                return Ok(new { deleted = true });
            }
            catch
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred." });
            }
        }
    }
}
