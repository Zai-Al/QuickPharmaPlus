using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Auth;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace QuickPharmaPlus.Server.Controllers.User_Managment
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Customer")] // or just [Authorize] if you prefer
    public class ExternalProfileController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _db;

        public ExternalProfileController(
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext db)
        {
            _userManager = userManager;
            _db = db;
        }

        // ==========================
        // GET CURRENT CUSTOMER PROFILE
        // ==========================
        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var identityUser = await _userManager.GetUserAsync(User);
            if (identityUser == null) return Unauthorized();

            var domainUser = await _db.Users
                .Include(u => u.Address)
                    .ThenInclude(a => a.City)
                .FirstOrDefaultAsync(u => u.EmailAddress == identityUser.Email);

            if (domainUser == null)
                return NotFound();

            var dto = new ExternalProfileDto
            {
                FirstName = domainUser.FirstName,
                LastName = domainUser.LastName,
                Email = domainUser.EmailAddress,
                PhoneNumber = domainUser.ContactNumber,
                City = domainUser.Address?.City?.CityName ?? identityUser.City,
                Block = domainUser.Address?.Block ?? identityUser.Block,
                Road = domainUser.Address?.Street ?? identityUser.Road,
                BuildingFloor = domainUser.Address?.BuildingNumber ?? identityUser.BuildingFloor
            };

            return Ok(dto);
        }

        // ==========================
        // UPDATE CURRENT CUSTOMER PROFILE
        // ==========================
        [HttpPut]
        public async Task<IActionResult> UpdateProfile([FromBody] ExternalProfileDto model)
        {
            if (model == null)
                return BadRequest(new { error = "Request body is required." });

            var identityUser = await _userManager.GetUserAsync(User);
            if (identityUser == null) return Unauthorized();

            // --- Update Identity user basic fields -------------
            identityUser.FirstName = model.FirstName?.Trim();
            identityUser.LastName = model.LastName?.Trim();
            identityUser.PhoneNumber = model.PhoneNumber?.Trim();
            identityUser.City = model.City;
            identityUser.Block = model.Block;
            identityUser.Road = model.Road;
            identityUser.BuildingFloor = model.BuildingFloor;

            var identityResult = await _userManager.UpdateAsync(identityUser);
            if (!identityResult.Succeeded)
            {
                var errors = identityResult.Errors.Select(e => e.Description).ToArray();
                return BadRequest(new { errors });
            }

            // --- Load domain user (from [User]) ----------------
            var domainUser = await _db.Users
                .Include(u => u.Address)
                .FirstOrDefaultAsync(u => u.EmailAddress == identityUser.Email);

            if (domainUser == null)
            {
                return BadRequest(new { error = "Domain customer record not found." });
            }

            domainUser.FirstName = model.FirstName;
            domainUser.LastName = model.LastName;
            domainUser.ContactNumber = model.PhoneNumber;

            // --- Address logic (similar to Register) -----------
            bool hasAnyAddressField =
                !string.IsNullOrWhiteSpace(model.City) ||
                !string.IsNullOrWhiteSpace(model.Block) ||
                !string.IsNullOrWhiteSpace(model.Road) ||
                !string.IsNullOrWhiteSpace(model.BuildingFloor);

            if (hasAnyAddressField && !string.IsNullOrWhiteSpace(model.City))
            {
                var cityName = model.City.Trim();

                var cityEntity = await _db.Cities
                    .FirstOrDefaultAsync(c => c.CityName == cityName);

                if (cityEntity != null)
                {
                    Address addressEntity;

                    // Update existing address if there is one
                    if (domainUser.AddressId.HasValue && domainUser.Address != null)
                    {
                        addressEntity = domainUser.Address;
                    }
                    else
                    {
                        // Create new address row
                        addressEntity = new Address();
                        _db.Addresses.Add(addressEntity);
                    }

                    addressEntity.Street = string.IsNullOrWhiteSpace(model.Road)
                        ? null
                        : model.Road.Trim();

                    addressEntity.Block = string.IsNullOrWhiteSpace(model.Block)
                        ? null
                        : model.Block.Trim();

                    addressEntity.BuildingNumber = string.IsNullOrWhiteSpace(model.BuildingFloor)
                        ? null
                        : model.BuildingFloor.Trim();

                    addressEntity.CityId = cityEntity.CityId;

                    await _db.SaveChangesAsync();

                    domainUser.AddressId = addressEntity.AddressId;
                    domainUser.BranchId = cityEntity.BranchId;
                }
                // if city not found, we just don't touch the address / branch
            }

            await _db.SaveChangesAsync();

            return Ok(new { success = true });
        }


        // ==========================
        // DELETE CURRENT CUSTOMER PROFILE
        // ==========================

        [HttpDelete]
        public async Task<IActionResult> DeleteProfile()
        {
            try
            {
                // =================== GET CURRENT IDENTITY USER ===================
                var identityUser = await _userManager.GetUserAsync(User);
                if (identityUser == null)
                    return Unauthorized(new { error = "Not logged in." });

                var email = identityUser.Email ?? User?.Identity?.Name;

                // =================== LOAD DOMAIN USER (FOR DETAILS + CLEAN DELETE) ===================
                var domainUser = await _db.Users
                    .Include(u => u.Address)
                    .FirstOrDefaultAsync(u => u.IdentityUserId == identityUser.Id
                                           || (email != null && u.EmailAddress == email));

                // keep details for logs/debug
                var deletedName = domainUser != null
                    ? $"{domainUser.FirstName} {domainUser.LastName}".Trim()
                    : "";
                var deletedEmail = domainUser?.EmailAddress ?? email ?? "";

                // =================== DELETE FROM IDENTITY FIRST ===================
                // (same idea as employee delete, but we already have the identityUser)
                var identityResult = await _userManager.DeleteAsync(identityUser);
                if (!identityResult.Succeeded)
                {
                    var errors = string.Join(", ", identityResult.Errors.Select(e => e.Description));
                    return BadRequest(new { error = $"Failed to delete user from identity system: {errors}" });
                }

                // =================== DELETE DOMAIN ROWS AFTER IDENTITY ===================
                if (domainUser != null)
                {
                    if (domainUser.Address != null)
                        _db.Addresses.Remove(domainUser.Address);

                    _db.Users.Remove(domainUser);
                    await _db.SaveChangesAsync();
                }

                

                return Ok(new
                {
                    success = true,
                    message = "Customer deleted successfully.",
                    deleted = new { name = deletedName, email = deletedEmail }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { error = $"An unexpected error occurred: {ex.Message}" });
            }
        }


        /*
        [HttpDelete]
        public async Task<IActionResult> DeleteProfile()
        {
            var identityUser = await _userManager.GetUserAsync(User);
            if (identityUser == null)
                return Unauthorized();

            // Load Domain User (from QuickPharmaPlusDbContext)
            var domainUser = await _db.Users
                .Include(u => u.Address)
        .FirstOrDefaultAsync(u => u.EmailAddress == identityUser.Email);

            // Delete domain user row if exists
            if (domainUser != null)
            {
                if (domainUser.Address != null)
                {
                    _db.Addresses.Remove(domainUser.Address);
                }

                _db.Users.Remove(domainUser);
                await _db.SaveChangesAsync();
            }

            // Delete identity user from AspNetUsers
            var identityResult = await _userManager.DeleteAsync(identityUser);

            if (!identityResult.Succeeded)
            {
                var errors = identityResult.Errors.Select(e => e.Description).ToArray();
                return BadRequest(new { errors });
            }

            

            return Ok(new { success = true });
        }
        */
    }
}
