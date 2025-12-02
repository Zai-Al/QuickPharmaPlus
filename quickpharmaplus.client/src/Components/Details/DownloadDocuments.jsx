import "./Details.css";

export default function DownloadDocument({ documentUrl }) {

    const handleDownload = () => {
        if (documentUrl) {
            const link = document.createElement("a");
            link.href = documentUrl;
            link.download = documentUrl.split("/").pop(); // filename from URL
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <button
            type="button"
            className="download-btn-custom d-flex align-items-center gap-3"
            onClick={handleDownload}
        >
            <i className="bi bi-download fs-5"></i>
            Download Document
        </button>
    );
}
