using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.Order;

namespace QuickPharmaPlus.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrderStatusesController : ControllerBase
    {
        private readonly QuickPharmaPlusDbContext _db;

        public OrderStatusesController(QuickPharmaPlusDbContext db)
        {
            _db = db;
        }

        // GET: api/OrderStatuses
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var items = await _db.OrderStatuses
                .AsNoTracking()
                .OrderBy(s => s.OrderStatusId)
                .Select(s => new OrderStatusOptionDto
                {
                    OrderStatusId = s.OrderStatusId,
                    OrderStatusName = s.OrderStatusName
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}
