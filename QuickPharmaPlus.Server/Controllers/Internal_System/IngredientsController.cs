using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Pharmacist,Manager")]
    public class IngredientsController : ControllerBase
    {
        private readonly QuickPharmaPlusDbContext _context;

        public IngredientsController(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        // GET: api/Ingredients?pageNumber=1&pageSize=200
        [HttpGet]
        public async Task<IActionResult> GetAll(int pageNumber = 1, int pageSize = 200)
        {
            if (pageNumber <= 0) pageNumber = 1;
            if (pageSize <= 0) pageSize = 200;

            var query = _context.Ingredients.AsQueryable();

            var total = await query.CountAsync();

            var items = await query
                .OrderBy(i => i.IngredientName)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new IngredientDto
                {
                    IngredientId = i.IngredientId,
                    IngredientName = i.IngredientName
                })
                .ToListAsync();

            return Ok(new
            {
                items,
                totalCount = total,
                pageNumber,
                pageSize
            });
        }
    }
}