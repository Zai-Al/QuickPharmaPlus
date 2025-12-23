import "./Details.css";

function getFileNameFromHeadersOrUrl(res, documentUrl) {
    const cd = res.headers.get("content-disposition") || "";
    const match = cd.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
    if (match && match[1]) return decodeURIComponent(match[1].replace(/"/g, "").trim());

    if (documentUrl) {
        try {
            const url = new URL(documentUrl, window.location.origin);
            const last = url.pathname.split("/").filter(Boolean).pop();
            if (last) return last;
        } catch {
            // ignore
        }
    }

    return "document";
}

export default function DownloadDocument({ documentUrl }) {
    const handleDownload = async () => {
        if (!documentUrl) return;

        try {
            const res = await fetch(documentUrl, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to download document.");

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const filename = getFileNameFromHeadersOrUrl(res, documentUrl);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename;

            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Download failed:", err);
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
