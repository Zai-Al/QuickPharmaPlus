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

            [FromQuery] string[]? priceRanges = null,
            string? sortBy = "price-asc")
        {
            try
            {
                var parsedRanges = ParsePriceRanges(priceRanges);

                // IMPORTANT: Match repository signature order!
                // (supplierIds, categoryIds, productTypeIds)
                var result = await _productRepository.GetExternalProductsAsync(
                    pageNumber,
                    pageSize,
                    search,
                    supplierIds,
                    categoryIds,
                    productTypeIds,
                    parsedRanges,
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

        // ------------------------------------------------------------
        // GET api/ExternalProducts/filters
        // ------------------------------------------------------------
        [HttpGet("filters")]
        public async Task<IActionResult> GetExternalProductFilters()
        {
            try
            {
                var categories = await _context.Categories
                    .Select(c => new { id = c.CategoryId, name = c.CategoryName })
                    .OrderBy(x => x.name)
                    .ToListAsync();

                var brands = await _context.Suppliers
                    .Select(s => new { id = s.SupplierId, name = s.SupplierName })
                    .OrderBy(x => x.name)
                    .ToListAsync();

                var types = await _context.ProductTypes
                    .Select(t => new { id = t.ProductTypeId, name = t.ProductTypeName })
                    .OrderBy(x => x.name)
                    .ToListAsync();

                return Ok(new { categories, brands, types });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while loading external product filters");
                // Return a JSON error (helpful to the client), instead of HTML
                return StatusCode(500, new
                {
                    error = "Failed to load filter options",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        private static List<(decimal Min, decimal Max)> ParsePriceRanges(string[]? priceRanges)
        {
            var result = new List<(decimal Min, decimal Max)>();
            if (priceRanges == null) return result;

            foreach (var range in priceRanges)
            {
                if (string.IsNullOrWhiteSpace(range)) continue;
                var parts = range.Split('-', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 2
                    && decimal.TryParse(parts[0].Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var min)
                    && decimal.TryParse(parts[1].Trim(), NumberStyles.Number, CultureInfo.InvariantCulture, out var max))
                {
                    result.Add((Min: min, Max: max));
                }
            }
            return result;
        }
    }
}
