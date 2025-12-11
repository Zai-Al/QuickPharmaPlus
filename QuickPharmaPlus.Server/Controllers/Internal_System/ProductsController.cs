using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Product;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductRepository _repo;

        // === REGEX MATCH FRONT-END VALIDATION ===
        private static readonly Regex NamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex SupplierPattern = new(@"^[A-Za-z\s-]*$");
        private static readonly Regex CategoryPattern = new(@"^[A-Za-z\s]*$");
        private static readonly Regex IdPattern = new(@"^[0-9]*$");

        public ProductsController(IProductRepository repo)
        {
            _repo = repo;
        }

        // GET: api/Products?pageNumber=1&pageSize=10&search=...
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 10, string? search = null, int? supplierId = null, int? categoryId = null)
        {
            // === BACKEND VALIDATION (matches React rules) ===

            if (pageNumber <= 0 || pageSize <= 0)
                return BadRequest("Page number and page size must be positive.");

            // Validate search text
            if (!string.IsNullOrWhiteSpace(search))
            {
                // search may contain name or ID → validate both possibilities
                bool validName = NamePattern.IsMatch(search);
                bool validId = IdPattern.IsMatch(search);

                if (!validName && !validId)
                    return BadRequest("Search contains invalid characters.");
            }

            // Validate supplierId
            if (supplierId.HasValue && supplierId.Value <= 0)
                return BadRequest("SupplierId must be a positive integer.");

            // Validate categoryId
            if (categoryId.HasValue && categoryId.Value <= 0)
                return BadRequest("CategoryId must be a positive integer.");

            var result = await _repo.GetAllProductsAsync(pageNumber, pageSize, search, supplierId, categoryId);
            return Ok(result);
        }

        // GET api/Products/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            var dto = await _repo.GetProductByIdAsync(id);
            if (dto == null) return NotFound();
            return Ok(dto);
        }

        // POST api/Products
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Product model)
        {
            if (model == null)
                return BadRequest("Product cannot be null.");

            // Validate Product Name
            if (!string.IsNullOrWhiteSpace(model.ProductName) &&
                !NamePattern.IsMatch(model.ProductName))
                return BadRequest("Product name contains invalid characters.");

            var created = await _repo.AddProductAsync(model);
            return CreatedAtAction(nameof(GetById), new { id = created.ProductId }, created);
        }

        // PUT api/Products/{id}
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Product model)
        {
            if (model == null || model.ProductId != id)
                return BadRequest("Product ID mismatch.");

            // Validate Product Name
            if (!string.IsNullOrWhiteSpace(model.ProductName) &&
                !NamePattern.IsMatch(model.ProductName))
                return BadRequest("Product name contains invalid characters.");

            var updated = await _repo.UpdateProductAsync(model);
            if (updated == null) return NotFound();
            return Ok(updated);
        }

        // DELETE api/Products/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id <= 0)
                return BadRequest("Invalid product ID.");

            var success = await _repo.DeleteProductAsync(id);
            if (!success) return NotFound();
            return Ok(new { deleted = true });
        }
    }
}
