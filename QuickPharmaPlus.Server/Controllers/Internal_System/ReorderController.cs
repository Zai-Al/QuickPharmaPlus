using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class ReorderController : ControllerBase
    {
        private readonly IReorderRepository _repo;

        // Validation patterns (match frontend)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");

        public ReorderController(IReorderRepository repo)
        {
            _repo = repo;
        }

        // =============================================================
        // GET: api/Reorder?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null)
        {
            // Validation
            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            // Validate search text
            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                // If numeric → must match ID pattern
                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Reorder ID must contain only numbers.");
                }
                else
                {
                    // Otherwise validate as name search
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Search may only contain letters, numbers, spaces, +, -, and dots.");
                }
            }

            var result = await _repo.GetAllReordersAsync(pageNumber, pageSize, search);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // =============================================================
        // GET: api/Reorder/{id}
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid reorder ID.");

            var reorder = await _repo.GetReorderByIdAsync(id);

            if (reorder == null)
                return NotFound("Reorder not found.");

            return Ok(reorder);
        }

        // =============================================================
        // POST: api/Reorder
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Reorder model)
        {
            if (model == null)
                return BadRequest("Reorder data is required.");

            // Validate threshold
            if (model.ReorderThershold.HasValue && model.ReorderThershold.Value < 0)
                return BadRequest("Reorder threshold must be a non-negative number.");

            var created = await _repo.AddReorderAsync(model);

            return CreatedAtAction(nameof(GetById), new { id = created.ReorderId }, created);
        }

        // =============================================================
        // PUT: api/Reorder/{id}
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Reorder model)
        {
            if (model == null || model.ReorderId != id)
                return BadRequest("Reorder ID mismatch.");

            // Validate threshold
            if (model.ReorderThershold.HasValue && model.ReorderThershold.Value < 0)
                return BadRequest("Reorder threshold must be a non-negative number.");

            var updated = await _repo.UpdateReorderAsync(model);

            if (updated == null)
                return NotFound("Reorder not found.");

            return Ok(updated);
        }

        // =============================================================
        // DELETE: api/Reorder/{id}
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid reorder ID.");

            var success = await _repo.DeleteReorderAsync(id);

            if (!success)
                return NotFound("Reorder not found or could not be deleted.");

            return Ok(new { deleted = true, message = "Reorder deleted successfully." });
        }
    }
}
