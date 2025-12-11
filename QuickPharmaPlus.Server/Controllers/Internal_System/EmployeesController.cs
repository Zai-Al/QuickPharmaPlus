using System;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IUserRepository _repo;

        // BACKEND VALIDATION RULES MATCH FRONT-END RULES
        private static readonly Regex ValidNameRegex = new(@"^[A-Za-z .-]*$");
        private static readonly Regex ValidNumericRegex = new(@"^[0-9]*$");

        public EmployeesController(IUserRepository repo)
        {
            _repo = repo;
        }

        // UPDATED: backend-side paging + filtering support with validation
        [HttpGet("employees")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? nameSearch = null,
            [FromQuery] string? idSearch = null,
            [FromQuery] string? role = null)
        {
            // Sanitize name search to match front-end rules
            if (!string.IsNullOrWhiteSpace(nameSearch))
            {
                nameSearch = nameSearch.Trim();

                if (!ValidNameRegex.IsMatch(nameSearch))
                {
                    return BadRequest(new { error = "Invalid name format — allowed: letters, space, dot, dash." });
                }
            }

            // Sanitize ID search to numeric only
            if (!string.IsNullOrWhiteSpace(idSearch))
            {
                idSearch = idSearch.Trim();

                if (!ValidNumericRegex.IsMatch(idSearch))
                {
                    return BadRequest(new { error = "Invalid ID format — only numbers allowed." });
                }
            }

            // Prevent meaningless paging
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            var result = await _repo.GetAllEmployeesAsync(
                pageNumber,
                pageSize,
                nameSearch,
                idSearch,
                role
            );

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        [HttpGet("employee/{id:int}")]
        public async Task<IActionResult> Get(int id)
        {
            var employee = await _repo.GetEmployeeByIdAsync(id);
            if (employee == null) return NotFound();
            return Ok(employee);
        }

        [HttpPost]
        public async Task<IActionResult> Create(User user)
        {
            var created = await _repo.AddEmployeeAsync(user);
            return Ok(created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, User user)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            user.UserId = id;

            try
            {
                var updated = await _repo.UpdateEmployeeAsync(user);
                if (updated == null) return NotFound();
                return Ok(updated);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred." });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _repo.DeleteEmployeeAsync(id);
                return result ? Ok() : NotFound();
            }
            catch (Exception)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { error = "An unexpected error occurred." });
            }
        }
    }
}
