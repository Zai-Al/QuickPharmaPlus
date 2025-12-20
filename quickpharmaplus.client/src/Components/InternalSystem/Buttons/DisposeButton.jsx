import "./Buttons.css";

export default function DisposeButton({ onClick }) {
    return (
        <button
            className="delete-btn btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
            onClick={onClick}
        >
            <i className="bi bi-exclamation-triangle"></i>
            Dispose
        </button>
    );
}
