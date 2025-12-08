using System;

namespace QuickPharmaPlus.Server.ModelsDTO.Category
{
    public sealed class CategoryListDto
    {
        public int CategoryId { get; init; }
        public string? CategoryName { get; init; }
        public byte[]? CategoryImage { get; init; }
        public int ProductCount { get; init; }
    }
}
