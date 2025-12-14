using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;
using QuickPharmaPlus.Server.ModelsDTO.Product;
using QuickPharmaPlus.Server.Repositories.Interface;
using System.Text.RegularExpressions;
using System.Linq;


namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class ProductRepository : IProductRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        // SAME PATTERNS USED IN FRONTEND + CONTROLLER
        private static readonly Regex NamePattern = new(@"^[A-Za-z0-9 .\-+]*$");
        private static readonly Regex SupplierPattern = new(@"^[A-Za-z\s-]*$");
        private static readonly Regex CategoryPattern = new(@"^[A-Za-z\s]*$");
        private static readonly Regex IdPattern = new(@"^[0-9]*$");

        public ProductRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // PAGED + FILTERED PRODUCTS
        public async Task<PagedResult<ProductListDto>> GetAllProductsAsync(
            int pageNumber,
            int pageSize,
            string? search = null,
            int? supplierId = null,
            int? categoryId = null)
        {
            // === VALIDATION LAYER: mirrors frontend + controller ===

            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;

            // Validate search
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                bool validName = NamePattern.IsMatch(search);
                bool validId = IdPattern.IsMatch(search);

                if (!validName && !validId)
                {
                    // Return EMPTY result rather than breaking the frontend
                    return new PagedResult<ProductListDto>
                    {
                        Items = new List<ProductListDto>(),
                        TotalCount = 0
                    };
                }
            }

            // Validate supplier ID
            if (supplierId.HasValue && supplierId.Value <= 0)
            {
                return new PagedResult<ProductListDto>
                {
                    Items = new List<ProductListDto>(),
                    TotalCount = 0
                };
            }

            // Validate category ID
            if (categoryId.HasValue && categoryId.Value <= 0)
            {
                return new PagedResult<ProductListDto>
                {
                    Items = new List<ProductListDto>(),
                    TotalCount = 0
                };
            }

            // === QUERY START ===
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductType)
                .Include(p => p.Supplier)
                .AsQueryable();

            // Supplier filter
            if (supplierId.HasValue)
            {
                query = query.Where(p => p.SupplierId == supplierId.Value);
            }

            // Category filter
            if (categoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == categoryId.Value);
            }

            // Search filter
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();

                // If ID  exact match
                if (int.TryParse(term, out int idVal))
                {
                    query = query.Where(p => p.ProductId == idVal);
                }
                else
                {
                    var lower = term.ToLower();

                    query = query.Where(p =>
                        (p.ProductName ?? "").ToLower().StartsWith(lower) ||
                        (p.Category != null && (p.Category.CategoryName ?? "").ToLower().StartsWith(lower)) ||
                        (p.Supplier != null && (p.Supplier.SupplierName ?? "").ToLower().StartsWith(lower))
                    );
                }
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderBy(p => p.ProductId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductListDto
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ProductPrice = p.ProductPrice,
                    IsControlled = p.IsControlled,
                    SupplierId = p.SupplierId,
                    SupplierName = p.Supplier != null ? p.Supplier.SupplierName : null,
                    ProductTypeId = p.ProductTypeId,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,
                    InventoryCount = _context.Inventories.Count(i => i.ProductId == p.ProductId)
                })
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

        public async Task<ProductDetailDto?> GetProductByIdAsync(int id)
        {
            var p = await _context.Products
                .Include(x => x.Category)
                .Include(x => x.ProductType)
                .Include(x => x.Supplier)
                .FirstOrDefaultAsync(x => x.ProductId == id);

            if (p == null) return null;

            return new ProductDetailDto
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ProductDescription = p.ProductDescription,
                ProductPrice = p.ProductPrice,
                IsControlled = p.IsControlled,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier?.SupplierName,
                ProductTypeId = p.ProductTypeId,
                ProductTypeName = p.ProductType?.ProductTypeName,
                CategoryId = p.CategoryId,
                CategoryName = p.Category?.CategoryName,
                ProductImage = p.ProductImage
            };
        }

        public async Task<Product> AddProductAsync(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<Product?> UpdateProductAsync(Product product)
        {
            var existing = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == product.ProductId);
            if (existing == null) return null;

            existing.ProductName = product.ProductName;
            existing.ProductDescription = product.ProductDescription;
            existing.ProductPrice = product.ProductPrice;
            existing.IsControlled = product.IsControlled;
            existing.SupplierId = product.SupplierId;
            existing.ProductTypeId = product.ProductTypeId;
            existing.CategoryId = product.CategoryId;
            existing.ProductImage = product.ProductImage;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var existing = await _context.Products.FirstOrDefaultAsync(p => p.ProductId == id);
            if (existing == null) return false;

            var relatedInventories = _context.Inventories.Where(i => i.ProductId == id);
            _context.Inventories.RemoveRange(relatedInventories);

            _context.Products.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<ProductListDto>> GetExternalProductsAsync(
    int pageNumber,
    int pageSize,
    string? search = null,
    int[]? supplierIds = null,
    int[]? categoryIds = null,
    int[]? productTypeIds = null,
    int[]? branchIds = null,
    decimal? minPrice = null,
    decimal? maxPrice = null,
    string? sortBy = null)
        {
            // --- basic guards ---
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 12;

            // NEW: expiry cutoff date (ignore expired inventory)
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            // --- reuse your existing search validation pattern ---
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.Trim();
                bool validName = NamePattern.IsMatch(search);
                bool validId = IdPattern.IsMatch(search);

                if (!validName && !validId)
                {
                    return new PagedResult<ProductListDto>
                    {
                        Items = new List<ProductListDto>(),
                        TotalCount = 0
                    };
                }
            }

            // sanitize arrays (remove invalids, duplicates)
            supplierIds = supplierIds?.Where(x => x > 0).Distinct().ToArray();
            categoryIds = categoryIds?.Where(x => x > 0).Distinct().ToArray();
            productTypeIds = productTypeIds?.Where(x => x > 0).Distinct().ToArray();
            branchIds = branchIds?.Where(x => x > 0).Distinct().ToArray();

            // --- base query ---
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductType)
                .Include(p => p.Supplier)
                .AsQueryable();

            // --- multi filters ---
            if (supplierIds != null && supplierIds.Length > 0)
                query = query.Where(p => p.SupplierId.HasValue && supplierIds.Contains(p.SupplierId.Value));

            if (categoryIds != null && categoryIds.Length > 0)
                query = query.Where(p => categoryIds.Contains(p.CategoryId));

            if (productTypeIds != null && productTypeIds.Length > 0)
                query = query.Where(p => p.ProductTypeId.HasValue && productTypeIds.Contains(p.ProductTypeId.Value));

            // UPDATED: branch filter ignores expired inventory too
            if (branchIds != null && branchIds.Length > 0)
            {
                query = query.Where(p =>
                    _context.Inventories.Any(i =>
                        i.ProductId == p.ProductId &&
                        i.BranchId.HasValue &&
                        branchIds.Contains(i.BranchId.Value) &&
                        (i.InventoryQuantity ?? 0) > 0 &&
                        (i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                    )
                );
            }

            // --- price filter (SQL-translatable) ---
            if (minPrice.HasValue)
                query = query.Where(p => (p.ProductPrice ?? 0m) >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => (p.ProductPrice ?? 0m) <= maxPrice.Value);

            // --- search filter (Product + Category + Brand + Type + Branch location) ---
            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();

                // numeric search → product ID
                if (int.TryParse(term, out int idVal))
                {
                    query = query.Where(p => p.ProductId == idVal);
                }
                else
                {
                    var like = $"%{term}%";

                    query = query.Where(p =>
                        // Product name
                        EF.Functions.Like(p.ProductName ?? "", like)

                        // Category
                        || (p.Category != null &&
                            EF.Functions.Like(p.Category.CategoryName ?? "", like))

                        // Brand / Supplier
                        || (p.Supplier != null &&
                            EF.Functions.Like(p.Supplier.SupplierName ?? "", like))

                        // Product Type
                        || (p.ProductType != null &&
                            EF.Functions.Like(p.ProductType.ProductTypeName ?? "", like))

                        // Branch search (Inventory → Branch → Address → City)
                        || _context.Inventories.Any(i =>
                            i.ProductId == p.ProductId
                            && (i.InventoryQuantity ?? 0) > 0
                            && (i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                            && i.Branch != null
                            && i.Branch.Address != null
                            && (
                                (i.Branch.Address.City != null &&
                                 EF.Functions.Like(i.Branch.Address.City.CityName ?? "", like))
                                || EF.Functions.Like(i.Branch.Address.Block ?? "", like)
                                || EF.Functions.Like(i.Branch.Address.Street ?? "", like)
                                || EF.Functions.Like(i.Branch.Address.BuildingNumber ?? "", like)
                            )
                        )

         
                    );
                }
            }

            // --- sorting (BEFORE paging) ---
            sortBy = (sortBy ?? "").Trim().ToLowerInvariant();
            query = sortBy switch
            {
                "price-asc" => query.OrderBy(p => p.ProductPrice ?? 0m),
                "price-desc" => query.OrderByDescending(p => p.ProductPrice ?? 0m),
                "name-asc" => query.OrderBy(p => p.ProductName),
                "name-desc" => query.OrderByDescending(p => p.ProductName),
                _ => query.OrderBy(p => p.ProductId),
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(p => new ProductListDto
                {
                    ProductId = p.ProductId,
                    ProductName = p.ProductName,
                    ProductPrice = p.ProductPrice,
                    IsControlled = p.IsControlled,
                    SupplierId = p.SupplierId,
                    SupplierName = p.Supplier != null ? p.Supplier.SupplierName : null,
                    ProductTypeId = p.ProductTypeId,
                    ProductTypeName = p.ProductType != null ? p.ProductType.ProductTypeName : null,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category != null ? p.Category.CategoryName : null,

                    // UPDATED: SUM actual available stock quantity, ignore expired + ignore 0
                    InventoryCount =
                        (branchIds != null && branchIds.Length > 0)
                            ? _context.Inventories
                                .Where(i =>
                                    i.ProductId == p.ProductId &&
                                    i.BranchId.HasValue &&
                                    branchIds.Contains(i.BranchId.Value)
                                )
                                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                                .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                                .Sum(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0
                            : _context.Inventories
                                .Where(i => i.ProductId == p.ProductId)
                                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                                .Where(i => i.InventoryExpiryDate == null || i.InventoryExpiryDate >= today)
                                .Sum(i => (int?)(i.InventoryQuantity ?? 0)) ?? 0
                })
                .ToListAsync();

            return new PagedResult<ProductListDto>
            {
                Items = items,
                TotalCount = total
            };
        }

    }
}
