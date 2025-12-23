using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Authorize(Roles = "Admin,Manager,Pharmacist")]
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UserController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // Endpoint to fetch all customers
        [HttpGet("customers")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllCustomers()
        {
            var customers = await _userRepository.GetAllCustomersAsync();

            var result = customers.Select(c => new
            {
                c.UserId,
                FullName = $"{c.FirstName} {c.LastName}".Trim(),
                c.EmailAddress,
                BranchId = c.Branch?.BranchId,
                BranchName = c.Address?.City?.CityName,
                RoleName = c.Role?.RoleName
            });

            return Ok(result);
        }
    }
}