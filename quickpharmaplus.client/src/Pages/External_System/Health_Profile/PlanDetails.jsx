// src/Pages/External_System/PlanDetails.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import DialogModal from "../Shared_Components/DialogModal";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import "../Shared_Components/External_Style.css";
import { AuthContext } from "../../../Context/AuthContext.jsx";

export default function PlanDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { id: idFromUrl } = useParams();
    const { user } = useContext(AuthContext);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const userId = user?.userId || user?.id;

    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // planId can come from URL or navigation state
    const planId = useMemo(() => {
        return (
            idFromUrl ||
            location.state?.planId ||
            location.state?.plan?.prescriptionPlanId ||
            location.state?.plan?.planId ||
            location.state?.plan?.id ||
            null
        );
    }, [idFromUrl, location.state]);

    // ---------- Fetch plan details from DB ----------
    useEffect(() => {
        if (!userId || !planId) {
            setLoading(false);
            setLoadError("Missing plan id.");
            return;
        }

        const fetchPlanDetails = async () => {
            setLoading(true);
            setLoadError("");
            try {
                // ? Use a details endpoint (recommended)
                // Example: GET /api/PrescriptionPlan/user/{userId}/plans/{planId}
                const res = await fetch(
                    `${API_BASE}/api/PrescriptionPlan/user/${userId}/plans/${planId}`,
                    { credentials: "include" }
                );

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(text || "Failed to load plan details.");
                }

                const json = await res.json();
                setPlan(json || null);
            } catch (e) {
                console.error(e);
                setPlan(null);
                setLoadError(e?.message || "Failed to load plan details.");
            } finally {
                setLoading(false);
            }
        };

        fetchPlanDetails();
    }, [API_BASE, userId, planId]);

    const method = useMemo(() => {
        if (!plan) return "";
        return plan.method || plan.shipping?.method || "";
    }, [plan]);


    const statusText = plan?.statusName || plan?.status || plan?.Status || "Ongoing";

    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/PrescriptionPlan/user/${userId}/${planId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const ok = await res.json();
            if (!ok) throw new Error("Delete failed");

            navigate("/healthProfile", {
                state: {
                    openPrescriptionPlanTab: true,
                    successMessage: "Prescription plan deleted successfully.",
                },
            });
        } catch (e) {
            console.error(e);
            navigate("/healthProfile", {
                state: {
                    openPrescriptionPlanTab: true,
                    successMessage: "Failed to delete prescription plan.",
                },
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = () => {
        // pass the DB-fetched plan back for editing
        navigate("/healthProfile", {
            state: { openPlanEditForm: true, planToEdit: plan },
        });
    };

    // ---------- Loading / Error ----------
    if (loading) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Plan Details</h2>
                <p>Loading...</p>
                <button className="btn btn-outline-secondary mt-3" onClick={() => navigate("/healthProfile")}>
                    Back
                </button>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Plan Details</h2>
                <p className="text-danger">{loadError || "No plan data found."}</p>
                <button
                    className="btn qp-add-btn mt-3"
                    onClick={() => navigate("/healthProfile", { state: { openPrescriptionPlanTab: true } })}
                >
                    Back
                </button>
            </div>
        );
    }

    // ---------- Render ----------
    return (
        <div className="container py-5 plan-details-page">
            <div className="text-center mb-4">
                <h2 className="fw-bold">Prescription Plan Details</h2>
            </div>

            <div className="card shadow-sm text-start order-summary-card">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-4 plan-details-header">
                        <div className="plan-details-info">
                            <h5 className="fw-bold mb-3">Prescription Plan Details</h5>

                            <p>
                                <strong>Prescription Name: </strong>
                                {plan.prescriptionName || plan.name || plan.Name || "-"}
                            </p>

                            <p>
                                <strong>Prescription Plan Status: </strong>
                                <span className={statusText === "Ongoing" ? "text-success" : "text-danger"}>
                                    {statusText}
                                </span>
                            </p>

                            <p>
                                <strong>Creation Date: </strong>
                                {plan.prescriptionPlanCreationDate || plan.creationDate || plan.CreationDate || "-"}
                            </p>

                            <p className="mb-1">
                                <strong>Delivery Method: </strong>
                                {method === "pickup" ? "Pickup" : method === "delivery" ? "Delivery" : "Not specified"}
                            </p>

                            {method === "pickup" && (
                                <p className="mb-1">
                                    <strong>Pickup Branch: </strong>
                                    {plan.shipping?.pickupBranch ||
                                        plan.shipping?.PickupBranch ||
                                        plan.branchCityName ||
                                        plan.branchName ||
                                        "-"}
                                </p>
                            )}


                            {method === "delivery" && (
                                <>
                                    <p className="mb-1 mt-2 fw-bold">Shipping Address</p>
                                    <p className="mb-1">
                                        <strong>City:</strong> {plan.cityName || plan.shipping?.address?.city || plan.shipping?.Address?.City || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Block:</strong> {plan.block || plan.shipping?.address?.block || plan.shipping?.Address?.Block || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Road:</strong> {plan.road || plan.shipping?.address?.road || plan.shipping?.Address?.Road || "-"}
                                    </p>
                                    <p className="mb-1">
                                        <strong>Building Number/ Floor Number:</strong>{" "}
                                        {plan.buildingFloor || plan.shipping?.address?.buildingFloor || plan.shipping?.Address?.BuildingFloor || "-"}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="d-flex flex-column gap-2 plan-details-actions">
                            <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)} disabled={loading}>
                                Cancel Plan
                            </button>

                            {statusText === "Ongoing" && (
                                <button className="btn qp-edit-btn" onClick={handleEditClick} disabled={loading}>
                                    Edit Plan
                                </button>
                            )}
                        </div>
                    </div>

                    <OrderItemsTable
                        items={(plan.items || plan.Items || []).map((x, idx) => ({
                            id: idx + 1,
                            name: x.productName || x.name,
                            quantity: x.quantity ?? 0,
                            type: x.typeName || x.productTypeName || x.dosage || x.type || "-",
                            price: x.unitPrice ?? x.price ?? 0,          // ? from DB
                            category: x.categoryName || x.category || "-", // ? from DB
                            incompatibilities: x.incompatibilities,
                            requiresPrescription: x.requiresPrescription,
                        }))}
                        showDeliveryFee={true}
                        showTotalAmount={true}
                        shippingMethod={method}
                    />

                    <div className="text-end mt-4">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate("/healthProfile", { state: { openPrescriptionPlanTab: true } })}
                            disabled={loading}
                        >
                            Back to Health Profile
                        </button>
                    </div>
                </div>
            </div>

            <DialogModal
                show={showDeleteModal}
                title="Delete Prescription Plan?"
                body="Are you sure you want to cancel this prescription plan?"
                confirmLabel="Cancel Plan"
                cancelLabel="Back"
                onConfirm={handleConfirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    );
}
