using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // later: [Authorize(Roles="Customer")]
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;

        public CartController(ICartRepository cartRepository)
        {
            _cartRepository = cartRepository;
        }

        // GET /api/cart?userId=5
        [HttpGet]
        public async Task<IActionResult> GetMyCart([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var items = await _cartRepository.GetMyAsync(userId);
                return Ok(new { count = items.Count, items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart Get failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // POST /api/cart/{productId}?userId=5&qty=2
        [HttpPost("{productId:int}")]
        public async Task<IActionResult> AddToCart(int productId, [FromQuery] int userId, [FromQuery] int qty = 1)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });
            if (qty <= 0) return BadRequest(new { error = "Invalid qty" });

            try
            {
                var (added, reason) = await _cartRepository.AddAsync(userId, productId, qty);

                // if stock issue, return 409 (so frontend can show message)
                if (!added && (reason == "OUT_OF_STOCK" || reason == "EXCEEDS_AVAILABLE_STOCK"))
                    return Conflict(new { added, reason });

                return Ok(new { added, reason });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart add failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // PUT /api/cart/{productId}?userId=5&qty=3   (set absolute quantity)
        [HttpPut("{productId:int}")]
        public async Task<IActionResult> UpdateQty(int productId, [FromQuery] int userId, [FromQuery] int qty)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var (updated, reason) = await _cartRepository.UpdateQtyAsync(userId, productId, qty);

                if (!updated && (reason == "OUT_OF_STOCK" || reason == "EXCEEDS_AVAILABLE_STOCK"))
                    return Conflict(new { updated, reason });

                if (!updated && reason == "NOT_FOUND")
                    return NotFound(new { updated, reason });

                return Ok(new { updated, reason });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart update failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // DELETE /api/cart/{productId}?userId=5
        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFromCart(int productId, [FromQuery] int userId)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removed = await _cartRepository.RemoveAsync(userId, productId);
                return Ok(new { removed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart remove failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        // DELETE /api/cart/clear?userId=5
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearCart([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removedCount = await _cartRepository.ClearAsync(userId);
                return Ok(new { removedCount });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Cart clear failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }
    }
}
