using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.ModelsDTO.Auth;
using QuickPharmaPlus.Server.Services;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Http.Features;


namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IEmailSender _emailSender;
        private readonly IWebHostEnvironment _env;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailSender emailSender,
            IWebHostEnvironment env)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;
            _env = env;
        }


        // ============================
        // VALIDATE PASSWORD
        // ============================
        [AllowAnonymous]
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
                    errors.AddRange(result.Errors.Select(e => e.Description));
            }

            return Ok(new { errors });
        }

        // ============================
        // CHANGE PASSWORD
        // ============================
        [Authorize]
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

            var result = await _userManager.ChangePasswordAsync(
                user,
                model.CurrentPassword ?? "",
                model.NewPassword ?? ""
            );

            if (result.Succeeded)
                return Ok(new { success = true });

            var errorList = result.Errors.Select(e => new { e.Code, e.Description }).ToArray();
            return BadRequest(new { errors = errorList });
        }

        // ============================
        // FORGOT PASSWORD
        // ============================
        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { errors = new[] { "Email is required." } });

            var email = model.Email!.Trim();
            var user = await _userManager.FindByEmailAsync(email);

            // Return neutral message for security
            if (user == null)
                return Ok(new { message = "If an account with that email exists, a reset link has been sent." });

            // Generate reset token
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            // Reset page URL (React)
            var clientUrl = "https://localhost:5173";
            var resetUrl = $"{clientUrl}/reset-password-public?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";

            // Try sending email
            try
            {
                string htmlMessage = $@"
                    <p>Hello,</p>
                    <p>You requested to reset your password.</p>
                    <p>Click the link below to reset it:</p>
                    <p><a href=""{resetUrl}"">{resetUrl}</a></p>
                    <p>If you didn't request this change, please ignore this email.</p>
                    <p>Best regards,<br/>QuickPharmaPlus Support</p>
                ";

                await _emailSender.SendEmailAsync(
                    user.Email,
                    "QuickPharmaPlus - Password Reset",
                    htmlMessage
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email send failed: {ex.Message}");
            }

            // Show developer diagnostics only in Development mode
            if (_env.IsDevelopment())
            {
                return Ok(new
                {
                    message = "If an account with that email exists, a reset link has been sent.",
                    dev = new
                    {
                        resetUrl,
                        token
                    }
                });
            }

            return Ok(new { message = "If an account with that email exists, a reset link has been sent." });
        }

        // ============================
        // RESET PASSWORD // NO AUTH
        // ============================
        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest model)
        {
            if (model == null)
                return BadRequest(new { errors = new[] { "Request is required." } });

            if (string.IsNullOrWhiteSpace(model.NewPassword) || string.IsNullOrWhiteSpace(model.ConfirmPassword))
                return BadRequest(new { errors = new[] { "New password and confirmation are required." } });

            if (model.NewPassword != model.ConfirmPassword)
                return BadRequest(new { errors = new[] { "New password and confirmation do not match." } });

            var email = model.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { errors = new[] { "Email is required." } });

            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return BadRequest(new { errors = new[] { "Invalid token or email." } });

            var result = await _userManager.ResetPasswordAsync(user, model.Token ?? "", model.NewPassword ?? "");
            if (result.Succeeded)
                return Ok(new { success = true });

            var errorList = result.Errors.Select(e => new { e.Code, e.Description }).ToArray();
            return BadRequest(new { errors = errorList });
        }


        [AllowAnonymous]
        [HttpPost("validate-password-public")]
        public async Task<IActionResult> ValidatePasswordPublic([FromBody] ValidatePasswordRequest model)
        {
            if (model == null || string.IsNullOrWhiteSpace(model.Password))
                return Ok(new { errors = new[] { "Password is required." } });

            var errors = new List<string>();

            // No logged-in user needed — pass NULL user
            foreach (var validator in _userManager.PasswordValidators)
            {
                var result = await validator.ValidateAsync(_userManager, null, model.Password);

                if (!result.Succeeded)
                    errors.AddRange(result.Errors.Select(e => e.Description));
            }

            return Ok(new { errors });
        }

        // ============================
        // LOGOUT
        // ============================
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // Sign out Identity (clears cookie)
            await _signInManager.SignOutAsync();

            // Guarded server-side session clear: will not throw if session middleware is not configured.
            var sessionFeature = HttpContext.Features.Get<ISessionFeature>();
            if (sessionFeature?.Session is { } session && session.IsAvailable)
            {
                session.Clear();
            }

            return Ok(new { success = true });
        }
    }
}
