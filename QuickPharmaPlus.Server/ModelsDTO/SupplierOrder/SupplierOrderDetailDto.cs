namespace QuickPharmaPlus.Server.ModelsDTO.SupplierOrder
{
    public class SupplierOrderDetailDto
    {
        public int SupplierOrderId { get; set; }
        public DateTime? SupplierOrderDate { get; set; }
        public int? SupplierOrderQuantity { get; set; }

        public int? SupplierOrderStatusId { get; set; }
        public string? SupplierOrderStatusType { get; set; }

        public int? SupplierId { get; set; }
        public string? SupplierName { get; set; }
        public string? SupplierContact { get; set; }
        public string? SupplierEmail { get; set; }

        public int? EmployeeId { get; set; }
        public string? EmployeeFullName { get; set; }
        public string? EmployeeEmail { get; set; }

        public int? ProductId { get; set; }
        public string? ProductName { get; set; }
        public string? ProductDescription { get; set; }
        public decimal? ProductPrice { get; set; }

        public int? SupplierOrderTypeId { get; set; }
        public string? SupplierOrderTypeName { get; set; }
    }
}
