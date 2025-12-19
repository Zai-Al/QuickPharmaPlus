namespace QuickPharmaPlus.Server.ModelsDTO.Checkout
{
    public class ShippingValidationResultDto
    {
        public bool Ok { get; set; }
        public int? BranchId { get; set; }
        public List<string> UnavailableProductNames { get; set; } = new();
        public string? Message { get; set; }
    }
}
