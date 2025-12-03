// src/Pages/External_System/PrescriptionDetails.jsx
import { useLocation, useNavigate } from "react-router-dom";
import TableFormat from "../Shared_Components/TableFormat";
import { useState } from "react";
import DialogModal from "../Shared_Components/DialogModal.jsx";
import "../Shared_Components/External_Style.css"; 

export default function PrescriptionDetails() {
    const location = useLocation();
    const navigate = useNavigate();

    const prescription = location.state?.prescription;
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    if (!prescription) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Details</h2>
                <p>No prescription data found.</p>
                <button
                    className="btn qp-add-btn mt-3"
                    onClick={() => navigate("/healthProfile")}
                >
                    Back
                </button>
            </div>
        );
    }

    // when user clicks the delete button (open dialog)
    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    // user cancels dialog
    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    // user confirms delete
    const handleConfirmDelete = () => {
        setShowDeleteModal(false);

        // (real app: call API here)

        navigate("/healthProfile", {
            state: { successMessage: "Prescription deleted successfully." },
        });
    };

    const handleEditClick = () => {
        navigate("/healthProfile", {
            state: {
                openPrescriptionEditForm: true,
                prescriptionToEdit: prescription,
            },
        });
    };

    return (
        <div className="container py-5 plan-details-page">
            {/* Page title */}
            <div className="text-center mb-4">
                <h2 className="fw-bold">Prescription Details</h2>
            </div>

            {/* Card */}
            <div className="card shadow-sm text-start order-summary-card">
                <div className="card-body">
                    {/* TOP ROW: left = details, right = buttons */}
                    <div className="d-flex justify-content-between align-items-start mb-4 plan-details-header">
                        {/* LEFT SIDE: all info */}
                        <div className="plan-details-info">
                            <h5 className="fw-bold mb-3">Prescription Details</h5>

                            <p>
                                <strong>Prescription Name: </strong>
                                {prescription.name}
                            </p>
                            <p>
                                <strong>Prescription Status: </strong>
                                <span className="text-warning">{prescription.status}</span>
                            </p>
                            <p>
                                <strong>Creation Date: </strong>
                                {prescription.creationDate}
                            </p>

                            {/* Registered Address */}
                            <div className="mt-3">
                                <h6 className="fw-bold">Registered Address</h6>
                                <p className="mb-1">
                                    <strong>City:</strong> {prescription.city}
                                </p>
                                <p className="mb-1">
                                    <strong>Block:</strong> {prescription.block}
                                </p>
                                <p className="mb-1">
                                    <strong>Road:</strong> {prescription.road}
                                </p>
                                <p className="mb-1">
                                    <strong>Building Number/ Floor Number:</strong>{" "}
                                    {prescription.buildingFloor}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT SIDE: buttons */}
                        <div className="d-flex flex-column gap-2 plan-details-actions">
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteClick}
                            >
                                Delete Prescription
                            </button>

                            {prescription.status === "Pending Approval" && (
                                <button
                                    className="btn qp-edit-btn"
                                    onClick={handleEditClick}
                                >
                                    Edit Prescription
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Documentation section */}
                    <div className="order-items-table">
                        <h6 className="fw-bold mb-3">Documentation</h6>

                        <TableFormat headers={["Document Name", "Actions"]}>
                            {/* Long-term Prescription row */}
                            <tr>
                                <td className="text-start">
                                    Long-term Prescription
                                    {prescription.prescriptionFileName && (
                                        <span className="d-block text-muted small">
                                            {prescription.prescriptionFileName}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button className="btn btn-sm qp-edit-btn me-2">
                                        View Document
                                    </button>
                                    <button className="btn btn-sm btn-secondary">
                                        Download Document
                                    </button>
                                </td>
                            </tr>

                            {/* CPR row */}
                            <tr>
                                <td className="text-start">
                                    CPR
                                    {prescription.cprFileName && (
                                        <span className="d-block text-muted small">
                                            {prescription.cprFileName}
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button className="btn btn-sm qp-edit-btn me-2">
                                        View Document
                                    </button>
                                    <button className="btn btn-sm btn-secondary">
                                        Download Document
                                    </button>
                                </td>
                            </tr>
                        </TableFormat>
                    </div>

                    {/* Back button (right side) */}
                    <div className="text-end mt-4">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                navigate("/healthProfile", {
                                    state: { openPrescriptionTab: true },
                                })
                            }
                        >
                            Back to Health Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* DELETE CONFIRMATION DIALOG */}
            <DialogModal
                show={showDeleteModal}
                title="Delete Prescription?"
                body="Are you sure you want to delete this prescription?"
                confirmLabel="Delete"
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}
