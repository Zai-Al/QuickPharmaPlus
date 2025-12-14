using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.External_System
{
    [ApiController]
    [Route("api/[controller]")]
    [AllowAnonymous] // later: [Authorize(Roles="Customer")]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistRepository _wishlistRepository;

        public WishlistController(IWishlistRepository wishlistRepository)
        {
            _wishlistRepository = wishlistRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWishlist([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var items = await _wishlistRepository.GetMyAsync(userId);
                return Ok(new { count = items.Count, items });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist Get failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        [HttpGet("ids")]
        public async Task<IActionResult> GetMyWishlistIds([FromQuery] int userId)
        {
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var ids = await _wishlistRepository.GetMyIdsAsync(userId);
                return Ok(new { ids });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist ids failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        [HttpPost("{productId:int}")]
        public async Task<IActionResult> AddToWishlist(int productId, [FromQuery] int userId)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var added = await _wishlistRepository.AddAsync(userId, productId);
                return Ok(new { added });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist add failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }

        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFromWishlist(int productId, [FromQuery] int userId)
        {
            if (productId <= 0) return BadRequest(new { error = "Invalid productId" });
            if (userId <= 0) return BadRequest(new { error = "Invalid userId" });

            try
            {
                var removed = await _wishlistRepository.RemoveAsync(userId, productId);
                return Ok(new { removed });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    error = "Wishlist remove failed",
                    message = ex.Message,
#if DEBUG
                    stackTrace = ex.StackTrace
#endif
                });
            }
        }
    }
}
