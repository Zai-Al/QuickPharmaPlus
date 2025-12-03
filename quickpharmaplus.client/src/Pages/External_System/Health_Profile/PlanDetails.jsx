// src/Pages/External_System/PrescriptionPlanDetails.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import DialogModal from "../Shared_Components/DialogModal";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import "../Shared_Components/External_Style.css";

export default function PlanDetails() {
    const location = useLocation();
    const navigate = useNavigate();

    const plan = location.state?.plan;
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    if (!plan) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Plan Details</h2>
                <p>No plan data found.</p>
                <button
                    className="btn qp-add-btn mt-3"
                    onClick={() => navigate("/healthProfile")}
                >
                    Back
                </button>
            </div>
        );
    }

    const shipping = plan.shipping || {};
    const method = shipping.method || ""; // "pickup" | "delivery" | ""

    const handleDeleteClick = () => setShowDeleteModal(true);
    const handleCancelDelete = () => setShowDeleteModal(false);

    const handleConfirmDelete = () => {
        setShowDeleteModal(false);
        // TODO: call API to cancel/delete plan
        navigate("/healthProfile", {
            state: {
                openPrescriptionPlanTab: true,
                successMessage: "Prescription plan deleted successfully.",
            },
        });
    };

    const handleEditClick = () => {
        navigate("/healthProfile", {
            state: { openPlanEditForm: true, planToEdit: plan },
        });
    };

    return (
        <div className="container py-5 plan-details-page">
            {/* Page title */}
            <div className="text-center mb-4">
                <h2 className="fw-bold">Prescription Plan Details</h2>
            </div>

            <div className="card shadow-sm text-start order-summary-card">
                <div className="card-body">
                    {/* TOP ROW: left = all details, right = buttons */}
                    <div className="d-flex justify-content-between align-items-center mb-4 plan-details-header">
                        {/* LEFT SIDE: heading + all text details */}
                        <div className="plan-details-info">
                            <h5 className="fw-bold mb-3">Prescription Plan Details</h5>

                            <p>
                                <strong>Prescription Name: </strong>
                                {plan.name}
                            </p>
                            <p>
                                <strong>Prescription Plan Status: </strong>
                                <span
                                    className={
                                        plan.status === "Ongoing"
                                            ? "text-success"
                                            : "text-danger"
                                    }
                                >
                                    {plan.status}
                                </span>
                            </p>
                            <p>
                                <strong>Creation Date: </strong>
                                {plan.creationDate}
                            </p>

                            <p className="mb-1">
                                <strong>Delivery Method: </strong>
                                {method === "pickup"
                                    ? "Pickup"
                                    : method === "delivery"
                                        ? "Delivery"
                                        : "Not specified"}
                            </p>

                            {method === "pickup" && (
                                <p className="mb-1">
                                    <strong>Pickup Branch: </strong>
                                    {shipping.pickupBranch || "-"}
                                </p>
                            )}

                            {method === "delivery" && (
                                <>
                                    <p className="mb-1 mt-2 fw-bold">Shipping Address</p>
                                    <p className="mb-1">
                                        <strong>City:</strong>{" "}
                                        {shipping.address?.city || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Block:</strong>{" "}
                                        {shipping.address?.block || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Road:</strong>{" "}
                                        {shipping.address?.road || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Building Number/ Floor Number:</strong>{" "}
                                        {shipping.address?.buildingFloor || "-"}
                                    </p>
                                </>
                            )}
                        </div>

                        {/* RIGHT SIDE: buttons */}
                        <div className="d-flex flex-column gap-2 plan-details-actions">
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteClick}
                            >
                                Delete Plan
                            </button>

                            {plan.status === "Ongoing" && (
                                <button
                                    className="btn qp-edit-btn"
                                    onClick={handleEditClick}
                                >
                                    Edit Plan
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SUMMARY TABLE (same as before) */}
                    <OrderItemsTable
                        items={plan.items || []}
                        showDeliveryFee={true}
                        showTotalAmount={true}
                        shippingMethod={method}
                    />

                    {/* Back button */}
                    <div className="text-end mt-4">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                navigate("/healthProfile", {
                                    state: { openPrescriptionPlanTab: true },
                                })
                            }
                        >
                            Back to Health Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete confirmation dialog */}
            <DialogModal
                show={showDeleteModal}
                title="Delete Prescription Plan?"
                body="Are you sure you want to cancel this prescription plan?"
                confirmLabel="Delete Plan"
                cancelLabel="Back"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
            />
        </div>
    );
}
