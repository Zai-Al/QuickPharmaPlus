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

        [HttpGet ("employees")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repo.GetAllEmployeesAsync());
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
            user.UserId = id;
            var updated = await _repo.UpdateEmployeeAsync(user);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _repo.DeleteEmployeeAsync(id);
            return result ? Ok() : NotFound();
        }

    }
}
