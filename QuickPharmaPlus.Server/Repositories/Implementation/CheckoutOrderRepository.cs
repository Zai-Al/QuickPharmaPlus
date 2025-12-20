using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.CheckoutOrder;
using QuickPharmaPlus.Server.ModelsDTO.Prescription;
using QuickPharmaPlus.Server.ModelsDTO.Prescription.Checkout;
using QuickPharmaPlus.Server.Repositories.Interface;
using Stripe.Checkout;


namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class CheckoutOrderRepository : ICheckoutOrderRepository
    {
        private readonly QuickPharmaPlusDbContext _db;
        private readonly ICartRepository _cartRepo;
        private readonly IPrescriptionRepository _prescriptionRepo;

        public CheckoutOrderRepository(
            QuickPharmaPlusDbContext db,
            ICartRepository cartRepo,
            IPrescriptionRepository prescriptionRepo)
        {
            _db = db;
            _cartRepo = cartRepo;
            _prescriptionRepo = prescriptionRepo;
        }

        // Bahrain time helper (Windows: "Arabian Standard Time")
        private static DateTime BahrainNow()
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("Arabian Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch
            {
                // fallback (+03:00)
                return DateTime.UtcNow.AddHours(3);
            }
        }

        public async Task<CheckoutCreateOrderResponseDto> CreateOrderFromCheckoutAsync(CheckoutCreateOrderRequestDto req)
        {
            if (req.UserId <= 0)
                return new CheckoutCreateOrderResponseDto { Created = false, Message = "Invalid userId." };

            // 1) Load cart from DB
            var cartItems = await _cartRepo.GetMyAsync(req.UserId);
            if (cartItems == null || cartItems.Count == 0)
                return new CheckoutCreateOrderResponseDto { Created = false, Message = "Cart is empty." };

            var prescribed = cartItems.Where(x => x.RequiresPrescription).ToList();

            // 2) Handle checkout prescription (ONLY if there are prescribed items)
            int? usedPrescriptionId = null;
            int? createdPrescriptionId = null;

            if (prescribed.Any())
            {
                // 2a) If uploading new prescription from checkout => create it first
                if (req.UploadNewPrescription)
                {
                    if (req.PrescriptionDocument == null || req.CprDocument == null)
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Prescription files required." };

                    // address required for checkout upload
                    if (!req.CityId.HasValue || string.IsNullOrWhiteSpace(req.Block) ||
                        string.IsNullOrWhiteSpace(req.Road) || string.IsNullOrWhiteSpace(req.BuildingFloor))
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Delivery address required for prescription upload." };

                    var createDto = new PrescriptionCreateDto
                    {
                        // Name can be empty; repo auto-fills for checkout
                        PrescriptionName = "",
                        CityId = req.CityId.Value,
                        Block = req.Block,
                        Road = req.Road,
                        BuildingFloor = req.BuildingFloor,
                        PrescriptionDocument = req.PrescriptionDocument,
                        PrescriptionCprDocument = req.CprDocument
                    };

                    createdPrescriptionId = await _prescriptionRepo.CreateCheckoutAsync(req.UserId, createDto);
                    if (createdPrescriptionId <= 0)
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Failed to create checkout prescription." };

                    usedPrescriptionId = createdPrescriptionId;
                }
                else
                {
                    // 2b) Otherwise user must provide approved prescription id (health OR code resolved)
                    if (!req.ApprovedPrescriptionId.HasValue || req.ApprovedPrescriptionId.Value <= 0)
                        return new CheckoutCreateOrderResponseDto
                        {
                            Created = false,
                            Message = "Approved prescription is required for prescribed items."
                        };

                    usedPrescriptionId = req.ApprovedPrescriptionId.Value;
                }

                // 2c) Validate prescription against cart using your existing validator
                var presRes = await _prescriptionRepo.ValidateCheckoutPrescriptionAsync(
                    req.UserId,
                    usedPrescriptionId.Value,
                    cartItems,
                    req.IsHealthProfile
                );

                if (!presRes.IsValid)
                {
                    return new CheckoutCreateOrderResponseDto
                    {
                        Created = false,
                        PrescriptionValid = false,
                        PrescriptionReason = presRes.Reason,
                        Message = "Prescription does not match prescribed products."
                    };
                }
            }

            // 3) Resolve shipping branch (pickup or delivery)
            int? branchId = null;

            if (req.Mode == "pickup")
            {
                if (!req.PickupBranchId.HasValue)
                    return new CheckoutCreateOrderResponseDto { Created = false, Message = "Pickup branch required." };

                branchId = req.PickupBranchId.Value;
            }
            else if (req.Mode == "delivery")
            {
                int? cityId = req.CityId;

                if (req.UseSavedAddress)
                {
                    cityId = await _db.Users
                        .Where(u => u.UserId == req.UserId)
                        .Select(u => u.Address!.CityId)
                        .FirstOrDefaultAsync();
                }

                if (!cityId.HasValue)
                    return new CheckoutCreateOrderResponseDto { Created = false, Message = "City required for delivery." };

                branchId = await _db.Cities
                    .Where(c => c.CityId == cityId.Value)
                    .Select(c => c.BranchId)
                    .FirstOrDefaultAsync();

                if (!branchId.HasValue)
                    return new CheckoutCreateOrderResponseDto { Created = false, Message = "City is not mapped to a branch." };

                // Slot required only if not urgent
                if (!req.IsUrgent)
                {
                    if (!req.ShippingDate.HasValue || !req.SlotId.HasValue)
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Delivery date/slot required." };
                }
            }
            else
            {
                return new CheckoutCreateOrderResponseDto { Created = false, Message = "Invalid mode." };
            }

            // 4) Validate branch inventory (ignore expired)
            var unavailable = await GetUnavailableNamesAsync(branchId!.Value, cartItems);
            if (unavailable.Count > 0)
            {
                return new CheckoutCreateOrderResponseDto
                {
                    Created = false,
                    UnavailableProductNames = unavailable,
                    Message = "Some products are not available in this branch."
                };
            }

            // 4.5) Compute totals server-side (so OrderTotal is NEVER null)
            var productIds = cartItems.Select(x => x.ProductId).Distinct().ToList();

            // IMPORTANT: Replace ProductPrice with your real price column if different
            var priceMap = await _db.Products
                .Where(p => productIds.Contains(p.ProductId))
                .Select(p => new { p.ProductId, p.ProductPrice })
                .ToDictionaryAsync(x => x.ProductId, x => x.ProductPrice ?? 0m);

            decimal subtotal = 0m;
            foreach (var it in cartItems)
            {
                var unit = priceMap.TryGetValue(it.ProductId, out var p) ? p : 0m;
                subtotal += unit * it.CartQuantity;
            }

            decimal deliveryFee = (req.Mode == "delivery") ? 1m : 0m;
            decimal orderTotal = subtotal + deliveryFee;

            // 5) Create everything in a transaction
            using var tx = await _db.Database.BeginTransactionAsync();

            try
            {
                int? addressId = null;

                // Create delivery address row if delivery and not using saved address
                if (req.Mode == "delivery" && !req.UseSavedAddress)
                {
                    if (!req.CityId.HasValue || string.IsNullOrWhiteSpace(req.Block) ||
                        string.IsNullOrWhiteSpace(req.Road) || string.IsNullOrWhiteSpace(req.BuildingFloor))
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Delivery address required." };

                    var address = new Address
                    {
                        CityId = req.CityId.Value,
                        Block = req.Block.Trim(),
                        Street = req.Road.Trim(),
                        BuildingNumber = req.BuildingFloor.Trim(),
                        IsProfileAdress = false
                    };

                    _db.Addresses.Add(address);
                    await _db.SaveChangesAsync();
                    addressId = address.AddressId;
                }

                int? profileAddressId = null;

                if (req.Mode == "delivery" && req.UseSavedAddress)
                {
                    profileAddressId = await _db.Users
                        .Where(u => u.UserId == req.UserId)
                        .Select(u => (int?)u.AddressId)   // assumes User has AddressId FK
                        .FirstOrDefaultAsync();

                    if (!profileAddressId.HasValue || profileAddressId.Value <= 0)
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "User does not have a saved profile address." };
                }
                var nowBH = BahrainNow();

                // Shipping
                var shipping = new Shipping
                {
                    UserId = req.UserId,
                    BranchId = branchId.Value,
                    AddressId = req.Mode == "delivery"
                        ? (req.UseSavedAddress ? profileAddressId : addressId)
                        : null,
                    ShippingIsDelivery = (req.Mode == "delivery"),
                    ShippingIsUrgent = (req.Mode == "delivery" ? req.IsUrgent : null),
                    ShippingSlotId = (req.Mode == "delivery" && !req.IsUrgent) ? req.SlotId : null,
                    ShippingDate = req.Mode != "delivery" ? null : req.IsUrgent ? nowBH.Date : (req.ShippingDate.HasValue ? req.ShippingDate.Value.ToDateTime(TimeOnly.MinValue) : (DateTime?)null)

                };

                _db.Shippings.Add(shipping);
                await _db.SaveChangesAsync();

                
                // ===== Payment (cash OR stripe online) =====
                var method = (req.PaymentMethod ?? "cash").Trim().ToLowerInvariant();

                int paymentMethodId;
                bool paymentSuccess = true;
                string? stripeIntentId = null;

                if (method == "online")
                {
                    if (string.IsNullOrWhiteSpace(req.StripeSessionId))
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Missing Stripe session id." };

                    var sessionService = new SessionService();
                    var session = sessionService.Get(req.StripeSessionId);

                    if (!string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                        return new CheckoutCreateOrderResponseDto { Created = false, Message = "Stripe payment not completed." };

                    paymentMethodId = 2; // ONLINE (make sure this exists in PaymentMethod table)
                    stripeIntentId = session.PaymentIntentId;
                }
                else
                {
                    paymentMethodId = 1; // CASH
                }

                var payment = new Payment
                {
                    PaymentMethodId = paymentMethodId,
                    PaymentTimestamp = nowBH,
                    PaymentAmount = orderTotal,
                    PaymentIsSuccessful = paymentSuccess,

                    // OPTIONAL: only if your Payment table has these columns
                    // StripeSessionId = req.StripeSessionId,
                    // StripePaymentIntentId = stripeIntentId
                };

                _db.Payments.Add(payment);
                await _db.SaveChangesAsync();


                // ===== Order =====
                // IMPORTANT: adjust property names to match your Order model
                var order = new Order
                {
                    UserId = req.UserId,
                    ShippingId = shipping.ShippingId,

                    OrderStatusId = 1,        // 1 = approved
                    OrderCreationDate = nowBH,
                    OrderTotal = orderTotal,

                    PaymentId = payment.PaymentId
                };

                _db.Orders.Add(order);
                await _db.SaveChangesAsync();

                // ProductOrders
                foreach (var it in cartItems)
                {
                    var po = new ProductOrder
                    {
                        OrderId = order.OrderId,
                        ProductId = it.ProductId,

                        // IMPORTANT: set your real quantity column name here:
                        // If your model is ProductOrderQuantity, keep it.
                        // If it's Quantity, replace it.
                        Quantity = it.CartQuantity,

                        // If you have a PrescriptionId FK on ProductOrder, set it ONLY for prescribed items
                        PrescriptionId = it.RequiresPrescription ? usedPrescriptionId : null
                    };

                    _db.ProductOrders.Add(po);
                }
                await _db.SaveChangesAsync();

                // Decrease inventory FEFO
                await DecreaseInventoryAsync(branchId.Value, cartItems);

                // Clear cart (direct DB remove)
                var cartRows = await _db.Carts.Where(c => c.UserId == req.UserId).ToListAsync();
                _db.Carts.RemoveRange(cartRows);
                await _db.SaveChangesAsync();

                await tx.CommitAsync();

                return new CheckoutCreateOrderResponseDto
                {
                    Created = true,
                    OrderId = order.OrderId,
                    ShippingId = shipping.ShippingId,
                    CreatedPrescriptionId = createdPrescriptionId,
                    Message = "Order created."
                };
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return new CheckoutCreateOrderResponseDto { Created = false, Message = ex.Message };
            }
        }

        private async Task<List<string>> GetUnavailableNamesAsync(
            int branchId,
            List<QuickPharmaPlus.Server.ModelsDTO.WishList_Cart.CartItemDto> cartItems)
        {
            var today = DateOnly.FromDateTime(BahrainNow());

            var productIds = cartItems.Select(i => i.ProductId).Distinct().ToList();

            var stock = await _db.Inventories
                .Where(i => i.BranchId == branchId)
                .Where(i => i.ProductId.HasValue && productIds.Contains(i.ProductId.Value))
                .Where(i => (i.InventoryQuantity ?? 0) > 0)
                .Where(i => !i.InventoryExpiryDate.HasValue || i.InventoryExpiryDate.Value >= today)
                .GroupBy(i => i.ProductId!.Value)
                .Select(g => new { ProductId = g.Key, Qty = g.Sum(x => x.InventoryQuantity ?? 0) })
                .ToListAsync();

            var map = stock.ToDictionary(x => x.ProductId, x => x.Qty);

            var insufficient = cartItems
                .Where(it => !map.TryGetValue(it.ProductId, out var avail) || avail < it.CartQuantity)
                .Select(it => it.ProductId)
                .Distinct()
                .ToList();

            if (!insufficient.Any()) return new();

            return await _db.Products
                .Where(p => insufficient.Contains(p.ProductId))
                .Select(p => p.ProductName ?? ("Product #" + p.ProductId))
                .ToListAsync();
        }

        private async Task DecreaseInventoryAsync(
            int branchId,
            List<QuickPharmaPlus.Server.ModelsDTO.WishList_Cart.CartItemDto> cartItems)
        {
            var today = DateOnly.FromDateTime(BahrainNow());

            foreach (var it in cartItems)
            {
                var remaining = it.CartQuantity;

                var batches = await _db.Inventories
                    .Where(i => i.BranchId == branchId && i.ProductId == it.ProductId)
                    .Where(i => (i.InventoryQuantity ?? 0) > 0)
                    .Where(i => !i.InventoryExpiryDate.HasValue || i.InventoryExpiryDate.Value >= today)
                    .OrderBy(i => i.InventoryExpiryDate.HasValue ? 0 : 1)
                    .ThenBy(i => i.InventoryExpiryDate)
                    .ToListAsync();

                foreach (var b in batches)
                {
                    if (remaining <= 0) break;

                    var qty = b.InventoryQuantity ?? 0;
                    if (qty <= 0) continue;

                    var take = Math.Min(qty, remaining);
                    b.InventoryQuantity = qty - take;
                    remaining -= take;
                }

                if (remaining > 0)
                    throw new Exception($"Stock changed while placing order (productId={it.ProductId}).");
            }

            await _db.SaveChangesAsync();
        }
    }
}
