using QuickPharmaPlus.Server.Models;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ICityRepository
    {
        Task<IEnumerable<City>> GetAllCitiesAsync();
    }
}
