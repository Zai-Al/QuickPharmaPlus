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
                SuccessUrl = $"{domain}/payment-success",
                CancelUrl = $"{domain}/payment-failed",
                Locale = "auto", // This will auto-detect the user's locale or use a valid default
                LineItems = new List<SessionLineItemOptions>()
            };

            foreach (var item in request.Items)
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

            try
            {
                var service = new SessionService();
                Session session = service.Create(options);
                return Ok(new { url = session.Url });
            }
            catch (StripeException ex)
            {
                return BadRequest(new { error = "Payment session creation failed", message = ex.Message });
            }
        }
    }

    public class CheckoutRequest
    {
        public List<ItemDTO> Items { get; set; } = new();
        public decimal DeliveryFee { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Total { get; set; }
    }

    public class ItemDTO
    {
        public string Name { get; set; } = "";
        public decimal Price { get; set; }
        public int Quantity { get; set; }
    }
}
