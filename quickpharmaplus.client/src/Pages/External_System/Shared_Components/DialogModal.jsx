export default function DialogModal({
    show,
    title,
    body,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel", // pass null to hide ONLY the cancel button
    onConfirm,
    onCancel,
}) {
    if (!show) return null;

    const showCancelButton = cancelLabel !== null;

    return (
        <>
            {/* Backdrop */}
            <div className="modal-backdrop fade show" />

            {/* Modal */}
            <div className="modal d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>

                            {/* ? X is ALWAYS visible */}
                            <button
                                type="button"
                                className="btn-close"
                                aria-label="Close"
                                onClick={onCancel}
                            />
                        </div>

                        <div className="modal-body">
                            {typeof body === "string" ? <p>{body}</p> : body}
                        </div>

                        <div className="modal-footer">
                            {/* ? Cancel button hidden ONLY if cancelLabel === null */}
                            {showCancelButton && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onCancel}
                                >
                                    {cancelLabel}
                                </button>
                            )}

                            <button
                                type="button"
                                className={`btn ${confirmLabel
                                        .toLowerCase()
                                        .includes("delete")
                                        ? "btn-danger"
                                        : "qp-edit-btn"
                                    }`}
                                onClick={onConfirm}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
