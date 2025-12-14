namespace QuickPharmaPlus.Server.ModelsDTO.SupplierOrder
{
    public class SupplierOrderListDto
    {
        public int SupplierOrderId { get; set; }
        public DateTime? SupplierOrderDate { get; set; }
        public int? SupplierOrderQuantity { get; set; }
        
        public int? SupplierOrderStatusId { get; set; }
        public string? SupplierOrderStatusType { get; set; }
        
        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        
        public int? EmployeeId { get; set; }
        public string? EmployeeFullName { get; set; }
        
        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        
        public int? SupplierOrderTypeId { get; set; }
        public string? SupplierOrderTypeName { get; set; }
        
        public int BranchId { get; set; }
        public string? BranchName { get; set; }
    }
}
