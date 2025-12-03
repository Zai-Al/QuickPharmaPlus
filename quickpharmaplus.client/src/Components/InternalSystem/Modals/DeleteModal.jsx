export default function DeleteModal({ id = "deleteModal", title = "Delete", message, onConfirm }) {

    return (
        <div className="modal fade" id={id} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content delete-modal-content">

                    <div className="modal-header border-0">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div className="modal-body text-center">
                        <p className="delete-text">{message}</p>
                    </div>

                    <div className="modal-footer border-0 d-flex justify-content-center gap-3">
                        <button className="btn btn-secondary px-4" data-bs-dismiss="modal">
                            Cancel
                        </button>

                        <button
                            className="btn btn-danger px-4"
                            onClick={onConfirm}
                        >
                            <i className="bi bi-trash"></i> Delete
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
