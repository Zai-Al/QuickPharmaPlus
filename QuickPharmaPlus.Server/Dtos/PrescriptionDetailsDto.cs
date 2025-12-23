public class PrescriptionDetailsDto
{
    public PatientDetailsDto PatientDetails { get; set; }
    public DocumentDto PrescriptionDocument { get; set; }
    public DocumentDto CprDocument { get; set; }
}

public class PatientDetailsDto
{
    public string Name { get; set; }
    public int Age { get; set; }
    public string Gender { get; set; }
    public string Contact { get; set; }
}

public class DocumentDto
{
    public string Url { get; set; }
    public string FileName { get; set; }
}