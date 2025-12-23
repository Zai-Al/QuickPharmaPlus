using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize(Roles = "Admin,Manager,Pharmacist,Driver")]
    public class OrderPaymentMethodsController : ControllerBase
    {
        private readonly QuickPharmaPlusDbContext _db;

        public OrderPaymentMethodsController(QuickPharmaPlusDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var items = await _db.PaymentMethods
                .AsNoTracking()
                .OrderBy(x => x.PaymentMethodId)
                .Select(x => new
                {
                    paymentMethodId = x.PaymentMethodId,
                    paymentMethodName = x.PaymentMethodName
                })
                .ToListAsync();

            return Ok(items);
        }
    }
}