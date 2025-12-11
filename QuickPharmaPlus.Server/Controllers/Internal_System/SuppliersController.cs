using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Supplier;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (match frontend)
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z\s-]+$");
        private static readonly Regex ValidIdPattern = new(@"^[0-9]+$");

        public SuppliersController(ISupplierRepository repo, QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        // =============================================================
        // GET: api/Suppliers?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 10, string? search = null)
        {
            // -------------------------------
            // VALIDATION ADDED HERE
            // -------------------------------
            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                // If numeric search → must match ID pattern
                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Supplier ID must contain numbers only.");
                }
                else
                {
                    // Name search validation
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Supplier name may only contain letters, spaces, and dashes.");
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
            // Validation
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
            if (dto == null) return BadRequest();

            // -------------------------------
            // VALIDATION ADDED HERE
            // -------------------------------
            if (string.IsNullOrWhiteSpace(dto.SupplierName) || !ValidNamePattern.IsMatch(dto.SupplierName.Trim()))
                return BadRequest("Supplier name may only contain letters, spaces, and dashes.");

            if (!string.IsNullOrWhiteSpace(dto.Representative) &&
                !ValidNamePattern.IsMatch(dto.Representative.Trim()))
                return BadRequest("Representative name may only contain letters, spaces, and dashes.");

            // Create address if address fields provided
            Address? address = null;
            bool hasAddress =
                !string.IsNullOrWhiteSpace(dto.City) ||
                !string.IsNullOrWhiteSpace(dto.Block) ||
                !string.IsNullOrWhiteSpace(dto.Road) ||
                !string.IsNullOrWhiteSpace(dto.Building);

            if (hasAddress)
            {
                address = new Address
                {
                    Street = dto.Road,
                    Block = dto.Block,
                    BuildingNumber = dto.Building,
                };

                if (!string.IsNullOrWhiteSpace(dto.City))
                {
                    var city = await _context.Cities
                        .FirstOrDefaultAsync(c => c.CityName != null &&
                        c.CityName.ToLower() == dto.City.Trim().ToLower());

                    if (city != null)
                        address.CityId = city.CityId;
                }

                _context.Addresses.Add(address);
                await _context.SaveChangesAsync();
            }

            var supplier = new Supplier
            {
                SupplierName = dto.SupplierName,
                SupplierRepresentative = dto.Representative,
                SupplierContact = dto.Contact,
                SupplierEmail = dto.Email,
                AddressId = address?.AddressId
            };

            var created = await _repo.AddSupplierAsync(supplier);

            return CreatedAtAction(nameof(GetById), new { id = created.SupplierId }, created);
        }

        // =============================================================
        // UPDATE SUPPLIER
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierRequest dto)
        {
            if (dto == null) return BadRequest();
            if (dto.SupplierId.HasValue && dto.SupplierId.Value != id)
                return BadRequest("Route id and body supplier id do not match.");

            // -------------------------------
            // VALIDATION ADDED HERE
            // -------------------------------
            if (!string.IsNullOrWhiteSpace(dto.SupplierName) &&
                !ValidNamePattern.IsMatch(dto.SupplierName.Trim()))
                return BadRequest("Supplier name may only contain letters, spaces, and dashes.");

            if (!string.IsNullOrWhiteSpace(dto.Representative) &&
                !ValidNamePattern.IsMatch(dto.Representative.Trim()))
                return BadRequest("Representative name may only contain letters, spaces, and dashes.");

            var existing = await _repo.GetSupplierByIdAsync(id);
            if (existing == null) return NotFound();

            existing.SupplierName = dto.SupplierName ?? existing.SupplierName;
            existing.SupplierRepresentative = dto.Representative ?? existing.SupplierRepresentative;
            existing.SupplierContact = dto.Contact ?? existing.SupplierContact;
            existing.SupplierEmail = dto.Email ?? existing.SupplierEmail;

            bool hasAddressPayload =
                dto.City != null || dto.Block != null || dto.Road != null || dto.Building != null;

            if (hasAddressPayload)
            {
                if (existing.AddressId.HasValue)
                {
                    var addr = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == existing.AddressId.Value);
                    if (addr != null)
                    {
                        addr.Street = dto.Road ?? addr.Street;
                        addr.Block = dto.Block ?? addr.Block;
                        addr.BuildingNumber = dto.Building ?? addr.BuildingNumber;

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
                        Street = dto.Road,
                        Block = dto.Block,
                        BuildingNumber = dto.Building
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

            var success = await _repo.DeleteSupplierAsync(id);
            if (!success) return NotFound();
            return Ok(new { deleted = true });
        }

        // -------------------------
        // Local request DTOs
        // -------------------------
        public class CreateSupplierRequest
        {
            public string? SupplierName { get; set; }
            public string? Representative { get; set; }
            public string? Contact { get; set; }
            public string? Email { get; set; }

            public string? City { get; set; }
            public string? Block { get; set; }
            public string? Road { get; set; }
            public string? Building { get; set; }
        }

        public class UpdateSupplierRequest
        {
            public int? SupplierId { get; set; }
            public string? SupplierName { get; set; }
            public string? Representative { get; set; }
            public string? Contact { get; set; }
            public string? Email { get; set; }

            public string? City { get; set; }
            public string? Block { get; set; }
            public string? Road { get; set; }
            public string? Building { get; set; }
        }
    }
}
