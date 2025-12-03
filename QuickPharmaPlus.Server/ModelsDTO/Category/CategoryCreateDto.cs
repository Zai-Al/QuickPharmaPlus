namespace QuickPharmaPlus.Server.ModelsDTO.Category
{
    public class CategoryCreateDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public IFormFile? CategoryImage { get; set; }
    }
}
