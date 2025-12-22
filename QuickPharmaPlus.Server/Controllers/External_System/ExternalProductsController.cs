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
using System.Linq;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous] // change to [Authorize(Roles = "Customer")] later if needed
    public class ExternalProductsController : ControllerBase
    {
        private readonly IProductRepository _productRepository;
        private readonly IIncompatibilityRepository _incompatRepo;
        private readonly ILogger<ExternalProductsController> _logger;
        private readonly QuickPharmaPlusDbContext _context;

        public ExternalProductsController(
            IProductRepository productRepository,
            IIncompatibilityRepository incompatRepo,
            ILogger<ExternalProductsController> logger,
            QuickPharmaPlusDbContext context)
        {
            _productRepository = productRepository;
            _incompatRepo = incompatRepo;
            _logger = logger;
            _context = context;
        }

        [HttpGet("ping")]
        public IActionResult Ping() => Ok(new { ok = true, where = "ExternalProductsController" });

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

            string? sortBy = "price-asc",

            // optional: only used to compute incompatibilities
            [FromQuery] int? userId = null
        )
        {
            try
            {
                // Keep using the existing repository method as-is (teammate-safe)
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

                        RequiresPrescription = dto.CategoryId == 1,

                        InventoryCount = dto.InventoryCount,

                        StockStatus =
                            dto.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                            dto.InventoryCount <= 5 ? "LOW_STOCK" :
                            "IN_STOCK",

                        Incompatibilities = null
                    })
                    .ToList();

                // attach images (your existing logic)
                var productIds = items.Select(x => x.Id).ToList();

                var imageMap = await _context.Products
                    .Where(p => productIds.Contains(p.ProductId))
                    .Select(p => new { p.ProductId, p.ProductImage })
                    .AsNoTracking()
                    .ToListAsync();

                var imageDict = imageMap.ToDictionary(
                    x => x.ProductId,
                    x => x.ProductImage != null ? Convert.ToBase64String(x.ProductImage) : null
                );

                foreach (var item in items)
                {
                    imageDict.TryGetValue(item.Id, out var base64);
                    item.ProductImageBase64 = base64;
                }

                // ✅ NEW: compute incompatibilities ONLY if userId provided
                if (userId.HasValue && userId.Value > 0 && items.Count > 0)
                {
                    var incMap = await _incompatRepo.GetMapAsync(userId.Value, productIds);

                    foreach (var it in items)
                    {
                        if (incMap.TryGetValue(it.Id, out var inc))
                        {
                            // keep same JSON shape your UI expects
                            it.Incompatibilities = new
                            {
                                medications = inc.Medications, // empty for now
                                allergies = inc.Allergies,
                                illnesses = inc.Illnesses
                            };
                        }
                        else
                        {
                            it.Incompatibilities = new
                            {
                                medications = Array.Empty<object>(),
                                allergies = Array.Empty<string>(),
                                illnesses = Array.Empty<string>()
                            };
                        }
                    }
                }

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
        public async Task<IActionResult> GetExternalProductById(int id, [FromQuery] int? userId = null)
        {
            if (id <= 0) return BadRequest(new { error = "Invalid id" });

            var dto = await _productRepository.GetProductByIdAsync(id);
            if (dto == null) return NotFound(new { error = "Product not found" });

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

                RequiresPrescription = dto.CategoryId == 1,

                InventoryCount = inventoryCount,
                StockStatus =
                    inventoryCount <= 0 ? "OUT_OF_STOCK" :
                    inventoryCount <= 5 ? "LOW_STOCK" :
                    "IN_STOCK",

                ProductImageBase64 = dto.ProductImage != null ? Convert.ToBase64String(dto.ProductImage) : null,

                Incompatibilities = null
            };

            // ✅ NEW: incompatibilities for single product
            if (userId.HasValue && userId.Value > 0)
            {
                var map = await _incompatRepo.GetMapAsync(userId.Value, new List<int> { id });

                if (map.TryGetValue(id, out var inc))
                {
                    detail.Incompatibilities = new
                    {
                        medications = inc.Medications,
                        allergies = inc.Allergies,
                        illnesses = inc.Illnesses
                    };
                }
                else
                {
                    detail.Incompatibilities = new
                    {
                        medications = Array.Empty<object>(),
                        allergies = Array.Empty<string>(),
                        illnesses = Array.Empty<string>()
                    };
                }
            }

            return Ok(detail);
        }

        [HttpGet("{id}/image")]
        public async Task<IActionResult> GetProductImage(int id)
        {
            var product = await _context.Products
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null || product.ProductImage == null || product.ProductImage.Length == 0)
                return NotFound();

            var bytes = product.ProductImage;
            var contentType = DetectImageContentType(bytes);

            return File(bytes, contentType);
        }

        private static string DetectImageContentType(byte[] bytes)
        {
            if (bytes == null || bytes.Length < 4) return "application/octet-stream";

            if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47)
                return "image/png";

            if (bytes[0] == 0xFF && bytes[1] == 0xD8)
                return "image/jpeg";

            if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46)
                return "image/gif";

            if (bytes.Length >= 12 &&
                bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
                bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50)
                return "image/webp";

            return "application/octet-stream";
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

        // GET: /api/ExternalProducts/best-sellers?top=10&userId=123
        [HttpGet("best-sellers")]
        public async Task<IActionResult> GetBestSellers([FromQuery] int top = 10, [FromQuery] int? userId = null)
        {
            var result = await _productRepository.GetBestSellersAsync(top);

            var items = (result ?? Enumerable.Empty<ProductListDto>())
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

                    RequiresPrescription = dto.CategoryId == 1,
                    InventoryCount = dto.InventoryCount,

                    StockStatus =
                        dto.InventoryCount <= 0 ? "OUT_OF_STOCK" :
                        dto.InventoryCount <= 5 ? "LOW_STOCK" :
                        "IN_STOCK",

                    Incompatibilities = null
                })
                .ToList();

            // attach base64 images (reuse your existing image logic)
            var productIds = items.Select(x => x.Id).ToList();

            var imageMap = await _context.Products
                .Where(p => productIds.Contains(p.ProductId))
                .Select(p => new { p.ProductId, p.ProductImage })
                .AsNoTracking()
                .ToListAsync();

            var imageDict = imageMap.ToDictionary(
                x => x.ProductId,
                x => x.ProductImage != null ? Convert.ToBase64String(x.ProductImage) : null
            );

            foreach (var item in items)
            {
                imageDict.TryGetValue(item.Id, out var base64);
                item.ProductImageBase64 = base64;
            }

            // optional: incompatibilities if userId passed (same as list endpoint)
            if (userId.HasValue && userId.Value > 0 && items.Count > 0)
            {
                var incMap = await _incompatRepo.GetMapAsync(userId.Value, productIds);

                foreach (var it in items)
                {
                    if (incMap.TryGetValue(it.Id, out var inc))
                    {
                        it.Incompatibilities = new
                        {
                            medications = inc.Medications,
                            allergies = inc.Allergies,
                            illnesses = inc.Illnesses
                        };
                    }
                    else
                    {
                        it.Incompatibilities = new
                        {
                            medications = Array.Empty<object>(),
                            allergies = Array.Empty<string>(),
                            illnesses = Array.Empty<string>()
                        };
                    }
                }
            }

            return Ok(new { items });
        }

    }
}
