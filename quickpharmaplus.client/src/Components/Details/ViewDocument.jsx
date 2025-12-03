import "./Details.css";

export default function ViewDocument({ documentUrl }) {

    const handleView = () => {
        if (documentUrl) {
            window.open(documentUrl, "_blank"); // opens PDF in new tab
        }
    };

    return (
        <button
            type="button"
            className="view-document-btn d-flex align-items-center gap-3"
            onClick={handleView}
        >
            <i className="bi bi-eye fs-5"></i>
            View Document
        </button>
    );
}
