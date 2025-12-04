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

            // 3. Get roles
            var roles = await _userManager.GetRolesAsync(user);

            // NEW: Get profile from your User table
            var appUser = await _userRepository.GetUserByEmailAsync(user.Email);

            if (appUser == null)
                return Unauthorized("User profile not found.");

            // 4. Return user info + roles  (your original comment stays here)
            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                Roles = roles,

                //added profile fields
                appUser.UserId,
                appUser.FirstName,
                appUser.LastName,
                appUser.ContactNumber,
                appUser.BranchId,
                appUser.RoleId,
                appUser.AddressId
            });
        }

    }
}
