using Microsoft.AspNetCore.Mvc;
using Stripe.Checkout;
using Stripe;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/stripe")]
    public class StripeController : ControllerBase
    {
        [HttpPost("create-checkout-session")]
        public IActionResult CreateCheckoutSession([FromBody] CheckoutRequest request)
        {
            var domain = "https://localhost:5173"; // your React dev URL

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                Mode = "payment",
                SuccessUrl = $"{domain}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                CancelUrl = $"{domain}/checkout?tab=payment&pay=cancel",
                //Locale = "auto", // This will auto-detect the user's locale or use a valid default
                LineItems = new List<SessionLineItemOptions>()
            };

            foreach (var item in request.Items ?? new List<ItemDTO>())
            {
                options.LineItems.Add(new SessionLineItemOptions
                {
                    Quantity = item.Quantity,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(item.Price * 100), // BHD → fils
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = item.Name
                        }
                    }
                });
            }

            if (request.DeliveryFee > 0)
            {
                options.LineItems.Add(new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = (long)(request.DeliveryFee * 100),
                        Currency = "usd",
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Delivery Fee"
                        }
                    }
                });
            }
            if (request.IsUrgent)
            {
                options.LineItems.Add(new SessionLineItemOptions
                {
                    Quantity = 1,
                    PriceData = new SessionLineItemPriceDataOptions
                    {
                        UnitAmount = 100, // 1 BHD (fils)
                        Currency = "usd", // keep consistent with your current setup
                        ProductData = new SessionLineItemPriceDataProductDataOptions
                        {
                            Name = "Urgent Delivery Fee"
                        }
                    }
                });
            }

            try
            {
                if (request == null || request.Items == null || request.Items.Count == 0)
                    return BadRequest(new { error = "No items provided." });

                var service = new SessionService();
                var session = service.Create(options);
                return Ok(new { url = session.Url });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { error = "Payment session creation failed", message = ex.Message });
            }
            catch (Exception ex)
            {
                // IMPORTANT: don’t crash the whole API on unexpected errors
                return StatusCode(500, new { error = "Unexpected server error", message = ex.Message });
            }

        }


        // GET api/stripe/verify-session?sessionId=...
        [HttpGet("verify-session")]
        public IActionResult VerifySession([FromQuery] string sessionId)
        {
            if (string.IsNullOrWhiteSpace(sessionId))
                return BadRequest(new { ok = false, message = "Missing sessionId." });

            try
            {
                var service = new SessionService();
                var session = service.Get(sessionId);

                // Stripe checkout session is “paid” if PaymentStatus == "paid"
                var paid = string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase);

                return Ok(new
                {
                    ok = true,
                    paid,
                    sessionId = session.Id,
                    paymentIntentId = session.PaymentIntentId
                });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { ok = false, message = ex.Message });
            }
        }


        public class CheckoutRequest
        {
            public List<ItemDTO> Items { get; set; } = new();
            public decimal DeliveryFee { get; set; }
            public decimal Subtotal { get; set; }
            public decimal Total { get; set; }
            public bool IsUrgent { get; set; }
        }

        public class ItemDTO
        {
            public string Name { get; set; } = "";
            public decimal Price { get; set; }
            public int Quantity { get; set; }
        }
    }
}