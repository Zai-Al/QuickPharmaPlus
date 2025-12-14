using Microsoft.EntityFrameworkCore;
using QuickPharmaPlus.Server.Models;
using QuickPharmaPlus.Server.ModelsDTO.SafetyCheck;
using QuickPharmaPlus.Server.Repositories.Interface;

namespace QuickPharmaPlus.Server.Repositories.Implementation
{
    public class SafetyCheckRepository : ISafetyCheckRepository
    {
        private readonly QuickPharmaPlusDbContext _context;

        public SafetyCheckRepository(QuickPharmaPlusDbContext context)
        {
            _context = context;
        }

        public async Task<InteractionCheckResponseDto> CheckProductInteractionsAsync(int productAId, int productBId)
        {
            var response = new InteractionCheckResponseDto
            {
                HasInteraction = false,
                Message = "",
                Interactions = new List<InteractionDetailDto>()
            };

            // Get all ingredients for Product A
            var ingredientsA = await _context.IngredientProducts
                .Where(ip => ip.ProductId == productAId)
                .Select(ip => ip.IngredientId)
                .ToListAsync();

            // Get all ingredients for Product B
            var ingredientsB = await _context.IngredientProducts
                .Where(ip => ip.ProductId == productBId)
                .Select(ip => ip.IngredientId)
                .ToListAsync();

            if (!ingredientsA.Any() || !ingredientsB.Any())
            {
                response.HasInteraction = false;
                response.Message = "These two products have no known interactions and are safe to consume together.";
                return response;
            }

            // Check for interactions between ingredients from both products
            var interactions = await _context.Interactions
                .Include(i => i.IngredientA)
                .Include(i => i.IngredientB)
                .Include(i => i.InteractionType)
                .Where(i =>
                    (ingredientsA.Contains(i.IngredientAId) && ingredientsB.Contains(i.IngredientBId)) ||
                    (ingredientsB.Contains(i.IngredientAId) && ingredientsA.Contains(i.IngredientBId))
                )
                .ToListAsync();

            if (interactions.Any())
            {
                response.HasInteraction = true;
                response.Interactions = interactions.Select(i => new InteractionDetailDto
                {
                    IngredientAName = i.IngredientA?.IngredientName ?? "Unknown",
                    IngredientBName = i.IngredientB?.IngredientName ?? "Unknown",
                    InteractionTypeName = i.InteractionType?.InteractionTypeName ?? "Unknown Type",
                    InteractionDescription = i.InteractionDescription ?? "No description available"
                }).ToList();

                // Build message with all interaction types
                var interactionTypes = string.Join(", ", response.Interactions.Select(i => i.InteractionTypeName).Distinct());

                // Build message with all interaction descriptions
                var interactionDescriptions = string.Join(" ", response.Interactions.Select(i => i.InteractionDescription).Distinct());

                response.Message = $"Warning: These products have known interactions ({interactionTypes}) and are not safe to consume together. {interactionDescriptions}";
            }
            else
            {
                response.HasInteraction = false;
                response.Message = "These two products have no known interactions and are safe to consume together.";
            }

            return response;
        }
    }
}