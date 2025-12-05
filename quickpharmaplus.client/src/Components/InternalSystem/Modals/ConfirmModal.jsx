export default function DialogModal({
    show,
    title,
    body,
    confirmLabel = "OK",
    onConfirm,
    onCancel,
}) {
    if (!show) return null;

    return (
        <>
            {/* Backdrop FIRST so it's behind the modal */}
            <div className="modal-backdrop fade show" />

            {/* Modal dialog on top */}
            <div className="modal d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onCancel}
                            ></button>
                        </div>

                        <div className="modal-body">
                            {typeof body === "string" ? <p>{body}</p> : body}
                        </div>

                        <div className="modal-footer">
                            <button
                                className={`btn ${confirmLabel.toLowerCase().includes("delete")
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