using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Auth;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AccountController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }


        // POST: api/account/validate-password
        [HttpPost("validate-password")]
        public async Task<IActionResult> ValidatePassword([FromBody] ValidatePasswordRequest model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Password))
                return BadRequest(new { errors = new[] { "Password is required." } });

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var errors = new List<string>();
            foreach (var validator in _userManager.PasswordValidators)
            {
                var result = await validator.ValidateAsync(_userManager, user, model.Password);
                if (!result.Succeeded)
                {
                    errors.AddRange(result.Errors.Select(e => e.Description));
                }
            }

            return Ok(new { errors });
        }

        // POST: api/account/change-password
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
        {
            if (model == null)
                return BadRequest(new { errors = new[] { "Request is required." } });

            if (string.IsNullOrWhiteSpace(model.NewPassword) || string.IsNullOrWhiteSpace(model.ConfirmPassword))
                return BadRequest(new { errors = new[] { "New password and confirmation are required." } });

            if (model.NewPassword != model.ConfirmPassword)
                return BadRequest(new { errors = new[] { "New password and confirmation do not match." } });

            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword ?? "", model.NewPassword ?? "");
            if (result.Succeeded)
            {
                return Ok(new { success = true });
            }

            var errorList = result.Errors.Select(e => new { e.Code, e.Description }).ToArray();
            return BadRequest(new { errors = errorList });
        }
    }
}