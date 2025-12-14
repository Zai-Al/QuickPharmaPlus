using QuickPharmaPlus.Server.ModelsDTO.SafetyCheck;

namespace QuickPharmaPlus.Server.Repositories.Interface
{
    public interface ISafetyCheckRepository
    {
        Task<InteractionCheckResponseDto> CheckProductInteractionsAsync(int productAId, int productBId);
    }
}