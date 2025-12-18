import PropTypes from "prop-types";

export default function DisposalModal({ show, onClose, onConfirm, product }) {
    if (!show) return null;

    const formatDate = (dateValue) => {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    return (
        <div
            className="modal fade show d-block"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            tabIndex="-1"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header justify-content-center position-relative">
                        <h5 className="modal-title text-warning d-flex align-items-center">
                            <i className="bi bi-exclamation-circle-fill me-2"></i>
                            Confirm Disposal
                        </h5>
                        <button
                            type="button"
                            className="btn-close position-absolute"
                            onClick={onClose}
                            style={{ right: "1rem" }}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <p className="mb-3 fw-bold text-warning">
                            Are you sure you want to dispose of this batch of products?
                        </p>
                        {product && (
                            <div className="mb-3">
                                <p className="mb-2 fw-bold text-warning">Product: {product.productName || "N/A"}</p>
                                <p className="mb-2 fw-bold text-warning">Branch: {product.branchCity || "N/A"}</p>
                                <p className="mb-2 fw-bold text-warning">Quantity: {product.quantity || 0}</p>
                                <p className="mb-2 fw-bold text-warning">Expires on: {formatDate(product.expiryDate)}</p>
                            </div>
                        )}
                        <p className="text-danger fw-bold fst-italic mb-0">
                            <small>Note: This action cannot be undone.</small>
                        </p>
                    </div>
                    <div className="modal-footer justify-content-center">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            style={{ width: "120px" }}
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={onConfirm}
                            style={{ width: "120px" }}
                        >
                            Dispose
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

DisposalModal.propTypes = {
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    product: PropTypes.shape({
        productName: PropTypes.string,
        branchCity: PropTypes.string,
        quantity: PropTypes.number,
        expiryDate: PropTypes.string
    })
};