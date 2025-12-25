using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Auth;
using QuickPharmaPlus.Server.Repositories.Interface;

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
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IUserRepository _userRepository;
        private readonly QuickPharmaPlusDbContext _dbContext;
        private readonly IQuickPharmaLogRepository _logRepo;

        // Domain RoleId for customer in [dbo].[Role]
        // Adjust if your Customer role has a different id.
        private const int CUSTOMER_ROLE_ID = 5;

        public AccountController(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            IEmailSender emailSender,
            IWebHostEnvironment env,
            RoleManager<IdentityRole> roleManager,
            IUserRepository userRepository,
            QuickPharmaPlusDbContext dbContext,
            IQuickPharmaLogRepository logRepo)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _emailSender = emailSender;
            _env = env;
            _roleManager = roleManager;
            _userRepository = userRepository;
            _dbContext = dbContext;
            _logRepo = logRepo;
        }

        // ============================
        // REGISTER (PUBLIC - CUSTOMER)
        // ============================
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] Register model)
        {
            if (model == null)
                return BadRequest(new { errors = new[] { "Request is required." } });

            if (string.IsNullOrWhiteSpace(model.Email))
                return BadRequest(new { errors = new[] { "Email is required." } });

            if (string.IsNullOrWhiteSpace(model.Password) || string.IsNullOrWhiteSpace(model.ConfirmPassword))
                return BadRequest(new { errors = new[] { "Password and confirmation are required." } });

            if (model.Password != model.ConfirmPassword)
                return BadRequest(new { errors = new[] { "Password and confirmation do not match." } });

            var email = model.Email.Trim();

            // Check if email already exists (Identity)
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
                return BadRequest(new { errors = new[] { "This email is already registered." } });

            // Map DTO -> Identity ApplicationUser (stores basic profile + optional address)
            var identityUser = new ApplicationUser
            {
                UserName = email,
                Email = email,
                PhoneNumber = model.PhoneNumber,
                FirstName = model.FirstName,
                LastName = model.LastName,
                City = model.City,
                Block = model.Block,
                Road = model.Road,
                BuildingFloor = model.BuildingFloor
            };

            // Create Identity user
            var result = await _userManager.CreateAsync(identityUser, model.Password);

            if (!result.Succeeded)
            {
                var errorList = result.Errors.Select(e => new { e.Code, e.Description }).ToArray();
                return BadRequest(new { errors = errorList });
            }

            // Ensure "Customer" role exists in Identity
            if (!await _roleManager.RoleExistsAsync("Customer"))
            {
                await _roleManager.CreateAsync(new IdentityRole("Customer"));
            }

            // Everyone registering via this endpoint becomes a Customer in Identity
            await _userManager.AddToRoleAsync(identityUser, "Customer");

            // ============================
            // Add entry into [dbo].[User]
            // + create Address if provided
            // ============================
            try
            {
                int? addressId = null;
                int? branchId = null;

                // Check if user actually entered any address field
                bool hasAnyAddressField =
                    !string.IsNullOrWhiteSpace(model.City) ||
                    !string.IsNullOrWhiteSpace(model.Block) ||
                    !string.IsNullOrWhiteSpace(model.Road) ||
                    !string.IsNullOrWhiteSpace(model.BuildingFloor);

                if (hasAnyAddressField && !string.IsNullOrWhiteSpace(model.City))
                {
                    // 1) Find City by name from [City] table
                    var cityName = model.City.Trim();
                    var cityEntity = await _dbContext.Cities
                        .FirstOrDefaultAsync(c => c.CityName == cityName);

                    if (cityEntity != null)
                    {
                        // 2) Create Address row in [Address]
                        var address = new Address
                        {
                            Street = string.IsNullOrWhiteSpace(model.Road)
                                ? null
                                : model.Road.Trim(),
                            Block = string.IsNullOrWhiteSpace(model.Block)
                                ? null
                                : model.Block.Trim(),
                            BuildingNumber = string.IsNullOrWhiteSpace(model.BuildingFloor)
                                ? null
                                : model.BuildingFloor.Trim(),
                            CityId = cityEntity.CityId
                        };

                        var addressEntry = await _dbContext.Addresses.AddAsync(address);
                        await _dbContext.SaveChangesAsync();

                        addressId = addressEntry.Entity.AddressId;
                        // Set branch from City's Branch_id
                        branchId = cityEntity.BranchId;
                    }
                    // If city name is invalid / not found, we simply skip creating Address.
                }

                // Map to your domain User table
                var domainUser = new User
                {
                    // UserId is IDENTITY in the database (auto generated)
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    ContactNumber = model.PhoneNumber,
                    EmailAddress = email,
                    AddressId = addressId,         // may be null if no/invalid address
                    RoleId = CUSTOMER_ROLE_ID,     // or will be resolved in repo
                    BranchId = branchId            // may be null if no city or no branch
                };

                // This will insert and SaveChanges inside the repository
                await _userRepository.AddCustomerAsync(domainUser);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to insert into [User]/[Address]: {ex.Message}");

                if (_env.IsDevelopment())
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Registration successful (Identity). Failed to insert customer/address in domain tables.",
                        dev = ex.Message
                    });
                }
            }

            return Ok(new { success = true, message = "Registration successful." });
        }

        // ============================
        // VALIDATE PASSWORD (AUTHED)
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
                var safeEmail = WebUtility.HtmlEncode(email);
                var safeResetUrl = WebUtility.HtmlEncode(resetUrl);

                var subject = "QuickPharmaPlus — Password Reset Request";

                var htmlMessage = $@"
                    <div style='font-family: Arial, sans-serif; line-height: 1.6; color: #111; max-width: 680px; margin: 0 auto;'>
                        <div style='margin: 0; padding: 18px 20px; border-radius: 12px; background: linear-gradient(135deg, #38b2ac 0%, #2c7a7b 100%);'>
                            <h2 style='margin: 0; color: #fff; font-size: 20px;'>Reset Your Password</h2>
                            <p style='margin: 6px 0 0 0; color: rgba(255,255,255,0.9); font-size: 13px;'>
                                QuickPharmaPlus Account Support
                            </p>
                        </div>

                        <div style='padding: 18px 4px 0 4px;'>
                            <p style='margin: 12px 0 0 0;'>Hello,</p>

                            <p style='margin: 10px 0 0 0;'>
                                We received a request to reset the password for your QuickPharmaPlus account (<b>{safeEmail}</b>).
                            </p>

                            <p style='margin: 12px 0 0 0;'>
                                Click the button below to set a new password:
                            </p>

                            <div style='margin: 16px 0 10px 0;'>
                                <a href='{resetUrl}'
                                   style='display: inline-block; padding: 12px 18px; border-radius: 10px; text-decoration: none;
                                          background: #2c7a7b; color: #fff; font-weight: 600;'>
                                    Reset Password
                                </a>
                            </div>

                            <p style='margin: 10px 0 0 0; font-size: 13px; color: #555;'>
                                If the button doesn’t work, copy and paste this link into your browser:
                            </p>

                            <p style='margin: 6px 0 0 0; font-size: 12px; color: #2c7a7b; word-break: break-all;'>
                                {safeResetUrl}
                            </p>

                            <div style='margin: 16px 0 0 0; padding: 12px; border: 1px solid #eee; border-radius: 10px; background: #fafafa;'>
                                <p style='margin: 0; font-size: 13px; color: #555;'>
                                    If you didn’t request this password reset, you can safely ignore this email.
                                </p>
                            </div>

                            <div style='margin-top: 18px; padding-top: 12px; border-top: 1px solid #eee;'>
                                <p style='margin: 0; font-size: 13px; color: #888;'>
                                    Best regards,<br />
                                    <b>QuickPharmaPlus</b>
                                </p>
                            </div>
                        </div>
                    </div>
                ";

                await _emailSender.SendEmailAsync(user.Email!, subject, htmlMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email send failed: {ex.Message}");
            }

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
        // RESET PASSWORD (PUBLIC)
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

        // ============================
        // VALIDATE PASSWORD (PUBLIC)
        // ============================
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
            // capture identity user BEFORE signing out
            var identityUser = await _userManager.GetUserAsync(User);
            if (identityUser != null)
            {
                var email = identityUser.Email ?? identityUser.UserName ?? "";

                // map identity -> domain user (User_id)
                var domainUser = await _dbContext.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id);

                if (domainUser != null)
                {
                    await _logRepo.CreateLogoutLogAsync(domainUser.UserId, email);
                }
            }

            await _signInManager.SignOutAsync();

            var sessionFeature = HttpContext.Features.Get<ISessionFeature>();
            if (sessionFeature?.Session is { } session && session.IsAvailable)
            {
                session.Clear();
            }

            return Ok(new { success = true });
        }
    }
}
