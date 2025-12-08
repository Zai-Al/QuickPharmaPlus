using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Category;
using QuickPharmaPlus.Server.Repositories.Implementation;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmployeesController : ControllerBase
    {
        private readonly IUserRepository _repo;

        public EmployeesController(IUserRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("employees")]
        public async Task<IActionResult> GetAll(
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            var result = await _repo.GetAllEmployeesAsync(pageNumber, pageSize);

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
                // domain validation (e.g. duplicate email)
                return BadRequest(new { error = ex.Message });
            }
            catch (Exception)
            {
                // log if you have a logger; return generic error to client
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
