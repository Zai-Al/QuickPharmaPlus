using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QuickPharmaPlus.Server.ModelsDTO.Report;

namespace QuickPharmaPlus.Server.Services.Reports
{
    public sealed class QuestPdfReportPdfGenerator : IReportPdfGenerator
    {
        public byte[] Generate(ReportGenerateRequestDto request, string title)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var createdUtc = DateTime.UtcNow;

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(32);
                    page.DefaultTextStyle(x => x.FontSize(11));

                    page.Header().Column(col =>
                    {
                        col.Item().Text("QuickPharmaPlus").FontSize(18).SemiBold();
                        col.Item().Text(title).FontSize(14).SemiBold();
                        col.Item().Text($"Generated (UTC): {createdUtc:yyyy-MM-dd HH:mm:ss}").FontColor(Colors.Grey.Darken1);
                    });

                    page.Content().PaddingTop(16).Column(col =>
                    {
                        col.Spacing(8);

                        col.Item().Text("Request Parameters").SemiBold().FontSize(12);

                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(140);
                                c.RelativeColumn();
                            });

                            void Row(string k, string? v)
                            {
                                t.Cell().Element(CellKey).Text(k);
                                t.Cell().Element(CellVal).Text(string.IsNullOrWhiteSpace(v) ? "—" : v);
                            }

                            Row("Report Type", request.ReportType);
                            Row("Branch", request.Branch ?? "All branches");
                            Row("Date From", request.DateFrom);
                            Row("Date To", request.DateTo);
                            Row("Category", request.ProductCategory);
                            Row("Supplier", request.Supplier);
                            Row("Product", request.Product);
                        });

                        col.Item().PaddingTop(16)
                            .Text("Next: replace this placeholder with real analytics (sales, inventory, compliance, etc.).")
                            .FontColor(Colors.Grey.Darken1);
                    });

                    page.Footer().AlignCenter().Text(x =>
                    {
                        x.Span("Page ");
                        x.CurrentPageNumber();
                        x.Span(" / ");
                        x.TotalPages();
                    });
                });
            });

            return doc.GeneratePdf();
        }

        private static IContainer CellKey(IContainer c) =>
            c.PaddingVertical(4).PaddingRight(8).DefaultTextStyle(x => x.SemiBold());

        private static IContainer CellVal(IContainer c) =>
            c.PaddingVertical(4);
    }
}