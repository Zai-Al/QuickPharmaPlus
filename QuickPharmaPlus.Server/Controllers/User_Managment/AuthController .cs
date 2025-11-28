using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using QuickPharmaPlus.Server.Identity;                 // ← Namespace for ApplicationUser + IdentityContext
using QuickPharmaPlus.Server.ModelsDTO.Auth;           // ← Namespace where LoginRequest.cs lives

namespace QuickPharmaPlus.Server.Controllers.User_Management
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
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

            // 4. Return user info + roles
            return Ok(new
            {
                user.Id,
                user.Email,
                user.UserName,
                Roles = roles
            });
        }
    }
}
