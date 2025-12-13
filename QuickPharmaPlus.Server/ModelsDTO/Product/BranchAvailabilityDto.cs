namespace QuickPharmaPlus.Server.ModelsDTO.Product
{
    public class BranchAvailabilityDto
    {
        public int BranchId { get; set; }

        // display fields (same style as BranchListDto)
        public string? CityName { get; set; }
        public string? Block { get; set; }
        public string? Street { get; set; }
        public string? BuildingNumber { get; set; }

        public int Stock { get; set; }
    }
}
