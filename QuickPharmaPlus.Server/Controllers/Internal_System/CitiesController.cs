using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Controllers.Internal_System
{
    [Route("api/[controller]")]
    [ApiController]
    public class CitiesController : ControllerBase
    {
        private readonly ICityRepository _repo;

        public CitiesController(ICityRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var cities = await _repo.GetAllCitiesAsync();
            // Return minimal shape expected by the client
            var result = cities.Select(c => new { cityId = c.CityId, cityName = c.CityName });
            return Ok(result);
        }
    }
}
