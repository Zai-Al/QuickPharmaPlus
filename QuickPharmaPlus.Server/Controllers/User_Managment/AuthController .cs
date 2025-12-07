using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.ModelsDTO.Auth;
using QuickPharmaPlus.Server.Models;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.User_Management
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IUserRepository _userRepository; 

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            QuickPharmaPlusDbContext context,
            IUserRepository userRepository)  
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _context = context;
            _userRepository = userRepository;
        }

        // ===========================
        //        LOGIN ENDPOINT
        // ===========================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest model)
        {
            if (!ModelState.IsValid)
                return BadRequest("Invalid login data.");

            // 1. Find user by email
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
                return Unauthorized("Invalid email or password.");

            // 2. Validate password
            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

            if (!result.Succeeded)
                return Unauthorized("Invalid email or password.");

            //3. Sign in the user to create auth cookie
            await _signInManager.SignInAsync(user, isPersistent: false);

            // 4. Get roles
            var roles = await _userManager.GetRolesAsync(user);

            // NEW: Get profile from your User table (repository includes Address + City via ThenInclude)
            var appUser = await _userRepository.GetUserByEmailAsync(user.Email);

            if (appUser == null)
                return Unauthorized("User profile not found.");

            // Build DTO including Address + City
            var response = new LoggedInUserResponse
            {
                IdentityId = user.Id,
                UserId = appUser.UserId,
                Email = user.Email,
                Roles = roles?.ToArray(),

                FirstName = appUser.FirstName,
                LastName = appUser.LastName,
                ContactNumber = appUser.ContactNumber,

                BranchId = appUser.BranchId,
                RoleId = appUser.RoleId,
                AddressId = appUser.AddressId,

                Address = appUser.Address is not null ? new AddressDto
                {
                    AddressId = appUser.Address.AddressId,
                    Street = appUser.Address.Street,
                    Block = appUser.Address.Block,
                    BuildingNumber = appUser.Address.BuildingNumber,
                    City = appUser.Address.City?.CityName
                } : null
            };

            return Ok(response);
        }

    }
}
