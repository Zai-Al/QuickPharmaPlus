using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Product;
using QuickPharmaPlus.Server.Repositories.Interface;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous] // change to [Authorize(Roles = "Customer")] later if needed
    public class ExternalProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly ILogger<ExternalProductsController> _logger;
        private readonly QuickPharmaPlusDbContext _context;

        public ExternalProductsController(
            IProductRepository productRepository,
            ILogger<ExternalProductsController> logger,
            QuickPharmaPlusDbContext context)
        {
            _productRepository = productRepository;
            _logger = logger;
            _context = context;
        }
        [HttpGet("ping")]
        public IActionResult Ping() => Ok(new { ok = true, where = "ExternalProductsController" });

        /// <summary>
        /// Customer-facing products list (SERVER-SIDE filtering).
        /// Supports:
        /// - pagination
        /// - search
        /// - categoryIds
        /// - supplierIds (brands)
        /// - productTypeIds
        /// - priceRanges (e.g. 1-5)
        /// - sortBy (price-asc, price-desc, name-asc, name-desc)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetExternalProducts(
    int pageNumber = 1,
    int pageSize = 12,
    string? search = null,

    [FromQuery] int[]? categoryIds = null,
    [FromQuery] int[]? supplierIds = null,
    [FromQuery] int[]? productTypeIds = null,
    [FromQuery] int[]? branchIds = null,

    decimal? minPrice = null,
    decimal? maxPrice = null,

    string? sortBy = "price-asc")
        {
            try
            {
                // IMPORTANT: Match repository signature order!
                var result = await _productRepository.GetExternalProductsAsync(
                    pageNumber,
                    pageSize,
                    search,
                    supplierIds,
                    categoryIds,
                    productTypeIds,
                    branchIds,
                    minPrice,
                    maxPrice,
                    sortBy
                );

                var items = (result?.Items ?? Enumerable.Empty<ProductListDto>())
                    .Select(dto => new CustomerProductListDto
                    {
                        Id = dto.ProductId,
                        Name = dto.ProductName,
                        Price = dto.ProductPrice,

                        CategoryId = dto.CategoryId,
                        CategoryName = dto.CategoryName,

                        ProductTypeId = dto.ProductTypeId,
                        ProductTypeName = dto.ProductTypeName,

                        SupplierId = dto.SupplierId,
                        SupplierName = dto.SupplierName,

                        RequiresPrescription = dto.IsControlled ?? false,

                        InventoryCount = dto.InventoryCount,

                        StockStatus =
                            dto.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                            dto.InventoryCount <= 5 ? "LOW_STOCK" :
                            "IN_STOCK",

                        Incompatibilities = null
                    })
                    .ToList();

                var totalCount = result?.TotalCount ?? 0;
                var totalPages = pageSize > 0
                    ? (int)Math.Ceiling(totalCount / (double)pageSize)
                    : 1;

                return Ok(new
                {
                    items,
                    totalPages,
                    totalCount,
                    pageNumber,
                    pageSize
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error in GetExternalProducts (page:{page}, size:{size}, search:{search})",
                    pageNumber,
                    pageSize,
                    search
                );

                return StatusCode(500, new
                {
                    error = "An unexpected error occurred while loading external products.",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }



        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetExternalProductById(int id)
        {
            if (id <= 0) return BadRequest(new { error = "Invalid id" });

            var dto = await _productRepository.GetProductByIdAsync(id);
            if (dto == null) return NotFound(new { error = "Product not found" });

            // Sum total units (ignore expired + ignore 0)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var inventoryCount = await _context.Inventories
                .Where(i => i.ProductId == id)
                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                .SumAsync(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0;

            var detail = new CustomerProductDetailDto
            {
                Id = dto.ProductId,
                Name = dto.ProductName,
                Description = dto.ProductDescription,
                Price = dto.ProductPrice,

                CategoryId = dto.CategoryId,
                CategoryName = dto.CategoryName,

                ProductTypeId = dto.ProductTypeId,
                ProductTypeName = dto.ProductTypeName,

                SupplierId = dto.SupplierId,
                SupplierName = dto.SupplierName,

                RequiresPrescription = dto.IsControlled ?? false,

                InventoryCount = inventoryCount,
                StockStatus =
                    inventoryCount <= 0 ? "OUT_OF_STOCK" :
                    inventoryCount <= 5 ? "LOW_STOCK" :
                    "IN_STOCK",

                ProductImageBase64 = dto.ProductImage != null ? Convert.ToBase64String(dto.ProductImage) : null,

                Incompatibilities = null
            };

            return Ok(detail);
        }


        [HttpGet("{id:int}/availability")]
        public async Task<IActionResult> GetProductAvailability(int id)
        {
            if (id <= 0) return BadRequest(new { error = "Invalid product id" });

            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            var rows = await _context.Inventories
                .Where(i => i.ProductId == id && i.BranchId.HasValue)
                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                .Select(i => new
                {
                    Qty = (i.InventoryQuantity ?? 0),
                    CityName =
                        i.Branch != null &&
                        i.Branch.Address != null &&
                        i.Branch.Address.City != null
                            ? i.Branch.Address.City.CityName
                            : "Unknown"
                })
                .ToListAsync();

            var items = rows
                .GroupBy(x => x.CityName)
                .Select(g => new BranchAvailabilityDto
                {
                    CityName = g.Key,
                    Stock = g.Sum(x => x.Qty)
                })
                .OrderByDescending(x => x.Stock)
                .ToList();

            var branchesCount = items.Count(x => x.Stock > 0);

            return Ok(new
            {
                branchesCount,
                items
            });
        }


    }
}
