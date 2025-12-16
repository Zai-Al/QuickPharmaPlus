export default function DeleteModal({
    show = false,
    onClose,
    onConfirm,
    title = "Confirm Deletion",
    message,
    children
}) {

    // Handle backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!show) return null;

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={handleBackdropClick}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content delete-modal-content">

                    <div className="modal-header border-0 justify-content-center position-relative">
                        <h5 className="modal-title fw-bold text-center text-danger w-100">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {title}
                        </h5>
                        <button
                            type="button"
                            className="btn-close position-absolute end-0 me-3"
                            onClick={onClose}
                        ></button>
                    </div>

                    <div className="modal-body text-center">
                        <div className="delete-text mb-3 text-danger">
                            {message}
                        </div>
                        {children && (
                            <div className="delete-details text-danger">
                                {children}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer border-0 d-flex justify-content-center gap-3">
                        <button
                            className="btn btn-cancel-custom delete-modal-btn"
                            onClick={onClose}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel
                        </button>

                        <button
                            className="btn btn-danger delete-modal-btn"
                            onClick={onConfirm}
                        >
                            <i className="bi bi-trash me-1"></i>
                            Delete
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}