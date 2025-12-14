using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class SupplierOrderController : ControllerBase
    {
        private readonly ISupplierOrderRepository _repo;
        private readonly QuickPharmaPlusDbContext _context;

        // Validation patterns (match frontend)
        private static readonly Regex ValidIdPattern = new(@"^[0-9]*$");
        private static readonly Regex ValidNamePattern = new(@"^[A-Za-z0-9 .\-+]*$");

        public SupplierOrderController(ISupplierOrderRepository repo, QuickPharmaPlusDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        // =============================================================
        // GET: api/SupplierOrder?pageNumber=1&pageSize=10&search=...
        // =============================================================
        [HttpGet]
        public async Task<IActionResult> GetAll(
            int pageNumber = 1,
            int pageSize = 10,
            string? search = null,
            DateOnly? orderDate = null)
        {
            // Validation
            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            // Validate search text
            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmed = search.Trim();

                // If numeric → must match ID pattern
                if (int.TryParse(trimmed, out _))
                {
                    if (!ValidIdPattern.IsMatch(trimmed))
                        return BadRequest("Supplier Order ID must contain only numbers.");
                }
                else
                {
                    // Otherwise validate as name search
                    if (!ValidNamePattern.IsMatch(trimmed))
                        return BadRequest("Search may only contain letters, numbers, spaces, +, -, and dots.");
                }
            }

            // Validate order date (similar to Inventory)
            if (orderDate.HasValue)
            {
                if (orderDate.Value.Year < 2000 || orderDate.Value.Year > 2100)
                {
                    return BadRequest("Invalid order date.");
                }
            }

            var result = await _repo.GetAllSupplierOrdersAsync(pageNumber, pageSize, search, orderDate);

            return Ok(new
            {
                items = result.Items,
                totalCount = result.TotalCount,
                pageNumber,
                pageSize
            });
        }

        // =============================================================
        // GET: api/SupplierOrder/{id}
        // =============================================================
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier order ID.");

            var supplierOrder = await _repo.GetSupplierOrderByIdAsync(id);

            if (supplierOrder == null)
                return NotFound("Supplier order not found.");

            return Ok(supplierOrder);
        }

        // =============================================================
        // GET: api/SupplierOrder/statuses - NEW ENDPOINT
        // =============================================================
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var statuses = await _context.SupplierOrderStatuses
                .Select(s => new
                {
                    statusId = s.ProductOrderStatusId,
                    statusType = s.ProductOrderStatusType
                })
                .ToListAsync();

            return Ok(statuses);
        }

        // =============================================================
        // GET: api/SupplierOrder/types - NEW ENDPOINT
        // =============================================================
        [HttpGet("types")]
        public async Task<IActionResult> GetTypes()
        {
            var types = await _context.SupplierOrderTypes
                .Select(t => new
                {
                    typeId = t.SupplierOrderTypeId,
                    typeName = t.SupplierOrderTypeName
                })
                .ToListAsync();

            return Ok(types);
        }

        // =============================================================
        // POST: api/SupplierOrder
        // =============================================================
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SupplierOrder model)
        {
            if (model == null)
                return BadRequest("Supplier order data is required.");

            // Validate quantity
            if (model.SupplierOrderQuantity.HasValue && model.SupplierOrderQuantity.Value < 0)
                return BadRequest("Supplier order quantity must be a non-negative number.");

            // Validate date (optional - cannot be in the future)
            if (model.SupplierOrderDate.HasValue && model.SupplierOrderDate.Value > DateTime.Now)
                return BadRequest("Supplier order date cannot be in the future.");

            var created = await _repo.AddSupplierOrderAsync(model);

            return CreatedAtAction(nameof(GetById), new { id = created.SupplierOrderId }, created);
        }

        // =============================================================
        // PUT: api/SupplierOrder/{id}
        // =============================================================
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] SupplierOrder model)
        {
            if (model == null || model.SupplierOrderId != id)
                return BadRequest("Supplier order ID mismatch.");

            // Validate quantity
            if (model.SupplierOrderQuantity.HasValue && model.SupplierOrderQuantity.Value < 0)
                return BadRequest("Supplier order quantity must be a non-negative number.");

            // Validate date (optional - cannot be in the future)
            if (model.SupplierOrderDate.HasValue && model.SupplierOrderDate.Value > DateTime.Now)
                return BadRequest("Supplier order date cannot be in the future.");

            var updated = await _repo.UpdateSupplierOrderAsync(model);

            if (updated == null)
                return NotFound("Supplier order not found.");

            return Ok(updated);
        }

        // =============================================================
        // DELETE: api/SupplierOrder/{id}
        // =============================================================
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid supplier order ID.");

            var success = await _repo.DeleteSupplierOrderAsync(id);

            if (!success)
                return NotFound("Supplier order not found or could not be deleted.");

            return Ok(new { deleted = true, message = "Supplier order deleted successfully." });
        }
    }
}
