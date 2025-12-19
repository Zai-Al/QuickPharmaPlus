using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class AddressesController : ControllerBase
    {
        private readonly QuickPharmaPlusDbContext _context;
        private readonly IAddressRepository _addressRepo;

        public AddressesController(QuickPharmaPlusDbContext context, IAddressRepository addressRepo)
        {
            _context = context;
            _addressRepo = addressRepo;
        }

        // Update existing address
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Address dto)
        {
            if (dto == null || id != dto.AddressId) return BadRequest();

            var existing = await _context.Addresses.FirstOrDefaultAsync(a => a.AddressId == id);
            if (existing == null) return NotFound();

            existing.Street = dto.Street;
            existing.Block = dto.Block;
            existing.BuildingNumber = dto.BuildingNumber;
            existing.CityId = dto.CityId;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // Create new address
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Address dto)
        {
            if (dto == null) return BadRequest();

            var address = new Address
            {
                Street = dto.Street,
                Block = dto.Block,
                BuildingNumber = dto.BuildingNumber,
                CityId = dto.CityId
            };

            _context.Addresses.Add(address);
            await _context.SaveChangesAsync();

            return Ok(new { addressId = address.AddressId });
        }

        // GET: api/Address/profile?userId=123
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile([FromQuery] int userId)
        {
            var dto = await _addressRepo.GetProfileAddressByUserIdAsync(userId);
            if (dto == null) return NotFound(new { message = "User does not have a saved profile address." });
            return Ok(dto);
        }
    }
}
