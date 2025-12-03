export default function SuccessAlert({ show, message, onClose }) {
    if (!show) return null;

    return (
        <div
            className="alert alert-success alert-dismissible fade show mt-3 text-start"
            role="alert"
        >
            <strong>Success!</strong> {message}
            <button
                type="button"
                className="btn-close"
                onClick={onClose}
            ></button>
        </div>
    );
}
