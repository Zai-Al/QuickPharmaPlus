namespace QuickPharmaPlus.Server.ModelsDTO.Branch
{
    public class BranchListDto
    {
        public int BranchId { get; set; }
        public int? AddressId { get; set; }

        // for display
        public string? CityName { get; set; }
        public string? Block { get; set; }
        public string? Street { get; set; }
        public string? BuildingNumber { get; set; }
    }
}
