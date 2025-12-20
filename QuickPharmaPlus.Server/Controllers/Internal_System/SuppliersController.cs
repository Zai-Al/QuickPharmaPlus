using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Identity;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Supplier;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierRepository _repo;
        private readonly IQuickPharmaLogRepository _logger;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (UPDATED TO MATCH FRONTEND)
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z\s.-]+$"); // Added dot
        private static readonly Regex ValidIdPattern = new(@"^[0-9]+$");
        private static readonly Regex ValidEmailPattern = new(@"^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$");
        private static readonly Regex ValidPhonePattern = new(@"^[0-9+\s-]+$");
        private static readonly Regex ValidBlockPattern = new(@"^[0-9]+$");
        private static readonly Regex ValidRoadPattern = new(@"^[A-Za-z0-9\s/.-]+$");
        private static readonly Regex ValidBuildingPattern = new(@"^[0-9]+$");

        public SuppliersController(
            ISupplierRepository repo,
            IQuickPharmaLogRepository logger,
            UserManager<ApplicationUser> userManager,
            QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _logger = logger;
            _userManager = userManager;
            _context = context;
        }

        // ================================
        // HELPER: GET CURRENT USER ID
        // ================================
        private async Task<int?> GetCurrentUserIdAsync()
        {
            try
            {
                var userEmail = User?.Identity?.Name;
                if (string.IsNullOrEmpty(userEmail))
                    return null;

                var identityUser = await _userManager.FindByEmailAsync(userEmail);
                if (identityUser == null)
                    return null;

                var domainUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailAddress == userEmail);

                return domainUser?.UserId;
            }
            catch
            {
                return null;
            }
        }

        // =============================================================
        // GET: api/Suppliers?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 10, string? search = null)
        {
            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Supplier ID must contain numbers only.");
                }
                else
                {
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Supplier name may only contain letters, spaces, dots (.), and dashes (-).");
                }
            }

            var result = await _repo.GetAllSuppliersAsync(pageNumber, pageSize, search);
            return Ok(result);
        }

        // =============================================================
        // GET SUPPLIER BY ID
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier ID.");

            var supplier = await _repo.GetSupplierByIdAsync(id);
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }

        // =============================================================
        // CREATE SUPPLIER
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest dto)
        {
            if (dto == null)
                return BadRequest("Request body cannot be empty.");

            // ========================
            // COMPREHENSIVE VALIDATION
            // ========================

            // Supplier Name Validation
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
                return BadRequest("Supplier name is required.");

            if (dto.SupplierName.Trim().Length < 3)
                return BadRequest("Supplier name must be at least 3 characters.");

            if (!ValidNamePattern.IsMatch(dto.SupplierName.Trim()))
                return BadRequest("Supplier name can only contain letters, spaces, dots (.), and dashes (-).");

            // Representative Name Validation
            if (string.IsNullOrWhiteSpace(dto.Representative))
                return BadRequest("Representative name is required.");

            if (dto.Representative.Trim().Length < 3)
                return BadRequest("Representative name must be at least 3 characters.");

            if (!ValidNamePattern.IsMatch(dto.Representative.Trim()))
                return BadRequest("Representative name can only contain letters, spaces, dots (.), and dashes (-).");

            // Contact Number Validation
            if (string.IsNullOrWhiteSpace(dto.Contact))
                return BadRequest("Contact number is required.");

            if (dto.Contact.Trim().Length < 6)
                return BadRequest("Contact number must be at least 6 characters.");

            if (!ValidPhonePattern.IsMatch(dto.Contact.Trim()))
                return BadRequest("Contact number can only contain numbers, +, spaces, and dash (-).");

            // Email Validation
            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            if (!ValidEmailPattern.IsMatch(dto.Email.Trim()))
                return BadRequest("Email must be valid (e.g., user@example.com).");

            // Address Validation (ALL REQUIRED)
            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest("City is required.");

            if (string.IsNullOrWhiteSpace(dto.Block))
                return BadRequest("Block is required.");

            if (!ValidBlockPattern.IsMatch(dto.Block.Trim()))
                return BadRequest("Block must contain numbers only.");

            if (string.IsNullOrWhiteSpace(dto.Road))
                return BadRequest("Road is required.");

            if (!ValidRoadPattern.IsMatch(dto.Road.Trim()))
                return BadRequest("Road cannot contain special characters like @, #, $, *, etc.");

            if (string.IsNullOrWhiteSpace(dto.Building))
                return BadRequest("Building is required.");

            if (!ValidBuildingPattern.IsMatch(dto.Building.Trim()))
                return BadRequest("Building must contain numbers only.");

            // ========================
            // CREATE ADDRESS FIRST
            // ========================
            var city = await _context.Cities
                .FirstOrDefaultAsync(c => c.CityName != null &&
                c.CityName.ToLower() == dto.City.Trim().ToLower());

            if (city == null)
                return BadRequest("Invalid city selected.");

            var address = new Address
            {
                CityId = city.CityId,
                Block = dto.Block.Trim(),
                Street = dto.Road.Trim(),
                BuildingNumber = dto.Building.Trim()
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            // ========================
            // CREATE SUPPLIER
            // ========================
            var supplier = new Supplier
            {
                SupplierName = dto.SupplierName.Trim(),
                SupplierRepresentative = dto.Representative.Trim(),
                SupplierContact = dto.Contact.Trim(),
                SupplierEmail = dto.Email.Trim(),
                AddressId = address.AddressId
            };

            var created = await _repo.AddSupplierAsync(supplier);

            // =================== LOG CREATION ===================
            try
            {
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue)
                {
                    var details = $"Supplier Name: {dto.SupplierName.Trim()}, " +
                                  $"Representative: {dto.Representative.Trim()}, " +
                                  $"Contact: {dto.Contact.Trim()}, " +
                                  $"Email: {dto.Email.Trim()}, " +
                                  $"Address: {city.CityName} / Block {dto.Block.Trim()} / Road {dto.Road.Trim()} / Building {dto.Building.Trim()}";

                    await _logger.CreateAddRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Supplier",
                        recordId: created.SupplierId,
                        details: details
                    );
                }
            }
            catch
            {
                // Logging failed - continue without failing the request
            }

            return CreatedAtAction(nameof(GetById), new { id = created.SupplierId }, created);
        }

        // =============================================================
        // UPDATE SUPPLIER
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierRequest dto)
        {
            if (dto == null) return BadRequest("Request body cannot be empty.");
            if (dto.SupplierId.HasValue && dto.SupplierId.Value != id)
                return BadRequest("Route id and body supplier id do not match.");

            // ========================
            // VALIDATION (Same as Create)
            // ========================
            if (string.IsNullOrWhiteSpace(dto.SupplierName))
                return BadRequest("Supplier name is required.");

            if (dto.SupplierName.Trim().Length < 3)
                return BadRequest("Supplier name must be at least 3 characters.");

            if (!ValidNamePattern.IsMatch(dto.SupplierName.Trim()))
                return BadRequest("Supplier name can only contain letters, spaces, dots (.), and dashes (-).");

            if (string.IsNullOrWhiteSpace(dto.Representative))
                return BadRequest("Representative name is required.");

            if (dto.Representative.Trim().Length < 3)
                return BadRequest("Representative name must be at least 3 characters.");

            if (!ValidNamePattern.IsMatch(dto.Representative.Trim()))
                return BadRequest("Representative name can only contain letters, spaces, dots (.), and dashes (-).");

            if (string.IsNullOrWhiteSpace(dto.Contact))
                return BadRequest("Contact number is required.");

            if (dto.Contact.Trim().Length < 6)
                return BadRequest("Contact number must be at least 6 characters.");

            if (!ValidPhonePattern.IsMatch(dto.Contact.Trim()))
                return BadRequest("Contact number can only contain numbers, +, spaces, and dash (-).");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            if (!ValidEmailPattern.IsMatch(dto.Email.Trim()))
                return BadRequest("Email must be valid (e.g., user@example.com).");

            if (string.IsNullOrWhiteSpace(dto.City))
                return BadRequest("City is required.");

            if (string.IsNullOrWhiteSpace(dto.Block))
                return BadRequest("Block is required.");

            if (!ValidBlockPattern.IsMatch(dto.Block.Trim()))
                return BadRequest("Block must contain numbers only.");

            if (string.IsNullOrWhiteSpace(dto.Road))
                return BadRequest("Road is required.");

            if (!ValidRoadPattern.IsMatch(dto.Road.Trim()))
                return BadRequest("Road cannot contain special characters like @, #, $, *, etc.");

            if (string.IsNullOrWhiteSpace(dto.Building))
                return BadRequest("Building is required.");

            if (!ValidBuildingPattern.IsMatch(dto.Building.Trim()))
                return BadRequest("Building must contain numbers only.");

            var existing = await _repo.GetSupplierByIdAsync(id);
            if (existing == null) return NotFound();

            // =================== TRACK CHANGES FOR LOGGING ===================
            var changes = new List<string>();
            try
            {
                if (existing.SupplierName != dto.SupplierName.Trim())
                    changes.Add($"Name: '{existing.SupplierName}' → '{dto.SupplierName.Trim()}'");

                if (existing.SupplierRepresentative != dto.Representative.Trim())
                    changes.Add($"Representative: '{existing.SupplierRepresentative}' → '{dto.Representative.Trim()}'");

                if (existing.SupplierContact != dto.Contact.Trim())
                    changes.Add($"Contact: '{existing.SupplierContact}' → '{dto.Contact.Trim()}'");

                if (existing.SupplierEmail != dto.Email.Trim())
                    changes.Add($"Email: '{existing.SupplierEmail}' → '{dto.Email.Trim()}'");
            }
            catch
            {
                // Continue if change tracking fails
            }

            existing.SupplierName = dto.SupplierName?.Trim() ?? existing.SupplierName;
            existing.SupplierRepresentative = dto.Representative?.Trim() ?? existing.SupplierRepresentative;
            existing.SupplierContact = dto.Contact?.Trim() ?? existing.SupplierContact;
            existing.SupplierEmail = dto.Email?.Trim() ?? existing.SupplierEmail;

            bool hasAddressPayload =
                dto.City != null || dto.Block != null || dto.Road != null || dto.Building != null;

            if (hasAddressPayload)
            {
                if (existing.AddressId.HasValue)
                {
                    var addr = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == existing.AddressId.Value);
                    if (addr != null)
                    {
                        addr.Street = dto.Road?.Trim() ?? addr.Street;
                        addr.Block = dto.Block?.Trim() ?? addr.Block;
                        addr.BuildingNumber = dto.Building?.Trim() ?? addr.BuildingNumber;

                        if (!string.IsNullOrWhiteSpace(dto.City))
                        {
                            var city = await _context.Cities
                                .FirstOrDefaultAsync(c => c.CityName != null &&
                                c.CityName.ToLower() == dto.City.Trim().ToLower());
                            if (city != null) addr.CityId = city.CityId;
                        }

                        await _context.SaveChangesAsync();
                    }
                }
                else
                {
                    var newAddr = new Address
                    {
                        Street = dto.Road?.Trim(),
                        Block = dto.Block?.Trim(),
                        BuildingNumber = dto.Building?.Trim()
                    };

                    if (!string.IsNullOrWhiteSpace(dto.City))
                    {
                        var city = await _context.Cities
                            .FirstOrDefaultAsync(c => c.CityName != null &&
                            c.CityName.ToLower() == dto.City.Trim().ToLower());
                        if (city != null) newAddr.CityId = city.CityId;
                    }

                    _context.Addresses.Add(newAddr);
                    await _context.SaveChangesAsync();

                    existing.AddressId = newAddr.AddressId;
                }
            }

            var updated = await _repo.UpdateSupplierAsync(existing);
            if (updated == null) return NotFound();

            // =================== LOG UPDATE ===================
            try
            {
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue && changes.Any())
                {
                    var details = $"Supplier: {dto.SupplierName.Trim()} - Changes: {string.Join(", ", changes)}";

                    await _logger.CreateEditRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Supplier",
                        recordId: id,
                        details: details
                    );
                }
            }
            catch
            {
                // Logging failed - continue without failing the request
            }

            return Ok(updated);
        }

        // =============================================================
        // DELETE SUPPLIER
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier ID.");

            // =================== CAPTURE DATA FOR LOGGING ===================
            string deletedSupplierName = "Unknown";
            string representative = "Unknown";
            string contact = "N/A";
            string email = "N/A";
            string addressInfo = "N/A";
            int productCount = 0;

            try
            {
                var supplierToDelete = await _context.Suppliers
                    .Include(s => s.Address)
                        .ThenInclude(a => a.City)
                    .FirstOrDefaultAsync(s => s.SupplierId == id);

                if (supplierToDelete != null)
                {
                    deletedSupplierName = supplierToDelete.SupplierName ?? "Unknown";
                    representative = supplierToDelete.SupplierRepresentative ?? "Unknown";
                    contact = supplierToDelete.SupplierContact ?? "N/A";
                    email = supplierToDelete.SupplierEmail ?? "N/A";

                    if (supplierToDelete.Address != null)
                    {
                        var cityName = supplierToDelete.Address.City?.CityName ?? "Unknown";
                        addressInfo = $"{cityName} / Block {supplierToDelete.Address.Block} / Road {supplierToDelete.Address.Street} / Building {supplierToDelete.Address.BuildingNumber}";
                    }

                    productCount = await _context.Products.CountAsync(p => p.SupplierId == id);
                }
            }
            catch
            {
                // Continue if data capture fails
            }

            var success = await _repo.DeleteSupplierAsync(id);
            if (!success) return NotFound();

            // =================== LOG DELETION ===================
            try
            {
                var currentUserId = await GetCurrentUserIdAsync();
                if (currentUserId.HasValue)
                {
                    var details = $"Supplier: {deletedSupplierName}, " +
                                  $"Representative: {representative}, " +
                                  $"Contact: {contact}, " +
                                  $"Email: {email}, " +
                                  $"Address: {addressInfo}, " +
                                  $"Products Supplied: {productCount}";

                    await _logger.CreateDeleteRecordLogAsync(
                        userId: currentUserId.Value,
                        tableName: "Supplier",
                        recordId: id,
                        details: details
                    );
                }
            }
            catch
            {
                // Logging failed - continue without failing the request
            }

            return Ok(new { deleted = true });
        }
    }
}