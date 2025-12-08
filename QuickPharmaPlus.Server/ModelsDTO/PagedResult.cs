namespace QuickPharmaPlus.Server.ModelsDTO
{
    public class PagedResult<T>
    {
        public IEnumerable<T>? Items { get; set; }
        public int TotalCount { get; set; }
    }
}
