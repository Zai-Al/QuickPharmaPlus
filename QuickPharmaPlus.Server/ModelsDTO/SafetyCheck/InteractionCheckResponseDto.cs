namespace QuickPharmaPlus.Server.ModelsDTO.SafetyCheck
{
    public class InteractionCheckResponseDto
    {
        public bool HasInteraction { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<InteractionDetailDto> Interactions { get; set; } = new List<InteractionDetailDto>();
    }

    public class InteractionDetailDto
    {
        public string IngredientAName { get; set; } = string.Empty;
        public string IngredientBName { get; set; } = string.Empty;
        public string InteractionTypeName { get; set; } = string.Empty;
        public string InteractionDescription { get; set; } = string.Empty;
    }
}