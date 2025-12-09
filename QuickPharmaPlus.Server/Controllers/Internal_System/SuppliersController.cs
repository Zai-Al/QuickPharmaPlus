using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Supplier;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SuppliersController : ControllerBase
    {
        private readonly ISupplierRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        public SuppliersController(ISupplierRepository repo, QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        // =============================================================
        // GET: api/Suppliers?pageNumber=1&pageSize=10&search=...
        // Fetch paged supplier list, supports search by numeric ID or name
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 10, string? search = null)
        {
            var result = await _repo.GetAllSuppliersAsync(pageNumber, pageSize, search);
            return Ok(result);
        }

        // =============================================================
        // GET: api/Suppliers/{id}
        // Fetch single supplier (includes address + city)
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var supplier = await _repo.GetSupplierByIdAsync(id);
            if (supplier == null) return NotFound();
            return Ok(supplier);
        }

        // =============================================================
        // POST: api/Suppliers
        // Create supplier along with a new address (if address fields provided).
        // Expects supplier + address payload (see CreateSupplierRequest).
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSupplierRequest dto)
        {
            if (dto == null) return BadRequest();

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

                // Try resolve city by name (case-insensitive)
                if (!string.IsNullOrWhiteSpace(dto.City))
                {
                    var city = await _context.Cities
                        .FirstOrDefaultAsync(c => c.CityName != null && c.CityName.ToLower() == dto.City.Trim().ToLower());

                    if (city != null)
                    {
                        address.CityId = city.CityId;
                    }
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
        // PUT: api/Suppliers/{id}
        // Update supplier details (and update/create address if payload includes address info)
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSupplierRequest dto)
        {
            if (dto == null) return BadRequest();
            if (dto.SupplierId.HasValue && dto.SupplierId.Value != id) return BadRequest("Route id and body supplier id do not match.");

            var existing = await _repo.GetSupplierByIdAsync(id);
            if (existing == null) return NotFound();

            // Update supplier scalar fields
            existing.SupplierName = dto.SupplierName ?? existing.SupplierName;
            existing.SupplierRepresentative = dto.Representative ?? existing.SupplierRepresentative;
            existing.SupplierContact = dto.Contact ?? existing.SupplierContact;
            existing.SupplierEmail = dto.Email ?? existing.SupplierEmail;

            // Handle address: update existing address, create new one, or leave unchanged
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
                                .FirstOrDefaultAsync(c => c.CityName != null && c.CityName.ToLower() == dto.City.Trim().ToLower());
                            if (city != null) addr.CityId = city.CityId;
                        }

                        await _context.SaveChangesAsync();
                    }
                }
                else
                {
                    // create new address and assign
                    var newAddr = new Address
                    {
                        Street = dto.Road,
                        Block = dto.Block,
                        BuildingNumber = dto.Building
                    };

                    if (!string.IsNullOrWhiteSpace(dto.City))
                    {
                        var city = await _context.Cities
                            .FirstOrDefaultAsync(c => c.CityName != null && c.CityName.ToLower() == dto.City.Trim().ToLower());
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
        // DELETE: api/Suppliers/{id}
        // Delete supplier (repository handles related cleanup)
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _repo.DeleteSupplierAsync(id);
            if (!success) return NotFound();
            return Ok(new { deleted = true });
        }


        // -------------------------
        // Local request DTOs
        // -------------------------
        public class CreateSupplierRequest
        {
            // Supplier fields
            public string? SupplierName { get; set; }
            public string? Representative { get; set; }
            public string? Contact { get; set; }
            public string? Email { get; set; }

            // Address fields (client sends city/block/road/building)
            public string? City { get; set; }
            public string? Block { get; set; }
            public string? Road { get; set; }
            public string? Building { get; set; }
        }

        public class UpdateSupplierRequest
        {
            // Optional: include supplier id in body
            public int? SupplierId { get; set; }

            // Supplier fields (nullable to allow partial updates)
            public string? SupplierName { get; set; }
            public string? Representative { get; set; }
            public string? Contact { get; set; }
            public string? Email { get; set; }

            // Address fields (nullable for partial updates)
            public string? City { get; set; }
            public string? Block { get; set; }
            public string? Road { get; set; }
            public string? Building { get; set; }
        }
    }
}
