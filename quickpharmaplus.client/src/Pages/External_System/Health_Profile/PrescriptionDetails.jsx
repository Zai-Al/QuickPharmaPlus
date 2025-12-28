// src/Pages/External_System/PrescriptionDetails.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useContext, useEffect, useMemo, useState } from "react";
import TableFormat from "../Shared_Components/TableFormat";
import DialogModal from "../Shared_Components/DialogModal.jsx";
import "../Shared_Components/External_Style.css";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { StatusBadge } from "../Shared_Components/statusUI";

export default function PrescriptionDetails() {
    
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { id } = useParams(); // prescriptionId from URL
    const userId = user?.userId || user?.id;

    const [prescription, setPrescription] = useState(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    const prescriptionId = useMemo(() => {
        if (!prescription) return null;
        return prescription.id || prescription.prescriptionId || null;
    }, [prescription]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            if (!userId) {
                setLoading(false);
                setErrorMsg("Please log in to view prescription details.");
                return;
            }

            try {
                setLoading(true);
                setErrorMsg("");

                const res = await fetch(
                    `${API_BASE}/api/Prescription/user/${encodeURIComponent(userId)}/${encodeURIComponent(id)}`,
                    { credentials: "include" }
                );

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || "Failed to load prescription details.");
                }

                const p = await res.json();

                // map backend dto -> your UI shape
                const normalizeStatus = (statusName, statusId) => {
                    if (statusName) return statusName;
                    const map = { 1: "Approved", 2: "Pending Approval", 3: "Expired", 4: "Rejected" };
                    return map[statusId] || "Unknown";
                };

                const formatDateOnly = (dateOnly) => {
                    if (!dateOnly) return "";
                    const [y, m, d] = String(dateOnly).split("-").map(Number);
                    const dt = new Date(y, m - 1, d);
                    return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                };

                setPrescription({
                    id: p.prescriptionId,
                    name: p.prescriptionName || "",
                    creationDate: p.prescriptionCreationDate ? formatDateOnly(p.prescriptionCreationDate) : "",
                    statusId: p.prescriptionStatusId,
                    status: normalizeStatus(p.prescriptionStatusName, p.prescriptionStatusId),

                    addressId: p.addressId ?? null,
                    cityId: p.cityId ? String(p.cityId) : "",
                    city: p.cityName ?? "",
                    cityName: p.cityName ?? "",
                    block: p.block ?? "",
                    road: p.road ?? "",
                    buildingFloor: p.buildingFloor ?? "",

                    hasPrescriptionDocument: !!p.hasPrescriptionDocument,
                    hasCprDocument: !!p.hasCprDocument,
                    prescriptionFileName: p.prescriptionFileName ?? "",
                    cprFileName: p.cprFileName ?? "",

                    latestApprovalExpiryDate: p.latestApprovalExpiryDate ? formatDateOnly(p.latestApprovalExpiryDate) : null,
                });
            } catch (err) {
                setErrorMsg(err?.message || "Failed to load prescription details.");
                setPrescription(null);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [API_BASE, userId, id]);

    const docUrls = useMemo(() => {
        if (!userId || !prescriptionId) return null;

        return {
            prescription: `${API_BASE}/api/Prescription/user/${userId}/${prescriptionId}/document`,
            cpr: `${API_BASE}/api/Prescription/user/${userId}/${prescriptionId}/cpr`,
        };
    }, [API_BASE, userId, prescriptionId]);

    if (loading) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Details</h2>
                <p>Loading...</p>
            </div>
        );
    }

    if (!prescription || !prescriptionId) {
        return (
            <div className="container py-5">
                <h2 className="mb-4">Prescription Details</h2>
                {errorMsg ? (
                    <div className="alert alert-danger text-start">{errorMsg}</div>
                ) : (
                    <p>No prescription data found.</p>
                )}
                <button className="btn qp-add-btn mt-3" onClick={() => navigate("/healthProfile")}>
                    Back
                </button>
            </div>
        );
    }


    // -----------------------------
    // Delete flow
    // -----------------------------
    const handleDeleteClick = () => setShowDeleteModal(true);
    const handleCancelDelete = () => setShowDeleteModal(false);

    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        setErrorMsg("");

        try {
            setLoading(true);

            const res = await fetch(
                `${API_BASE}/api/Prescription/user/${userId}/${prescriptionId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to delete prescription.");
            }

            navigate("/healthProfile", {
                state: {
                    openPrescriptionTab: true,
                    successMessage: "Prescription deleted successfully.",
                },
            });
        } catch (err) {
            setErrorMsg(err?.message || "Failed to delete prescription.");
        } finally {
            setLoading(false);
        }
    };

    // -----------------------------
    // Edit flow
    // -----------------------------
    const handleEditClick = () => {
        navigate("/healthProfile", {
            state: {
                openPrescriptionEditForm: true,
                prescriptionToEdit: prescription,
            },
        });
    };

    // -----------------------------
    // View / Download
    // View: open in new tab
    // Download: force download via blob
    // -----------------------------
    const handleView = (url) => {
        if (!url) return;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const handleDownload = async (url, filename) => {
        if (!url) return;

        try {
            setLoading(true);
            setErrorMsg("");

            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to download document.");
            }

            const blob = await res.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = filename || "document";
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            setErrorMsg(err?.message || "Failed to download document.");
        } finally {
            setLoading(false);
        }
    };

    // Support both old mock fields and new flags
    const hasPrescriptionDoc =
        prescription.hasPrescriptionDocument ??
        !!prescription.prescriptionFileName;

    const hasCprDoc =
        prescription.hasCprDocument ??
        !!prescription.cprFileName;

    const isPending = prescription.status === "Pending Approval";

    return (
        <div className="container py-5 plan-details-page">
            <div className="text-center mb-4">
                <h2 className="fw-bold">Prescription Details</h2>
            </div>

            <div className="card shadow-sm text-start order-summary-card">
                <div className="card-body">
                    {errorMsg && (
                        <div className="alert alert-danger text-start">{errorMsg}</div>
                    )}

                    <div className="d-flex justify-content-between align-items-start mb-4 plan-details-header">
                        <div className="plan-details-info">
                            <h5 className="fw-bold mb-3">Prescription Details</h5>

                            <p>
                                <strong>Prescription Name: </strong>
                                {prescription.name}
                            </p>
                            <p>
                                <strong>Prescription Status: </strong>
                                <StatusBadge status={prescription.status} />

                            </p>
                            <p>
                                <strong>Creation Date: </strong>
                                {prescription.creationDate}
                            </p>

                            {prescription.latestApprovalExpiryDate && (
                                <p>
                                    <strong>Expiry Date: </strong>
                                    {prescription.latestApprovalExpiryDate}
                                </p>
                            )}

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

                        <div className="d-flex flex-column gap-2 plan-details-actions">
                            <button
                                className="btn btn-danger"
                                onClick={handleDeleteClick}
                                disabled={loading}
                            >
                                Delete Prescription
                            </button>

                            {isPending && (
                                <button
                                    className="btn qp-edit-btn"
                                    onClick={handleEditClick}
                                    disabled={loading}
                                >
                                    Edit Prescription
                                </button>
                            )}
                        </div>
                    </div>

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
                                    {!hasPrescriptionDoc && (
                                        <span className="d-block text-muted small">
                                            No file uploaded.
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm qp-edit-btn me-2"
                                        onClick={() => handleView(docUrls?.prescription)}
                                        disabled={loading || !hasPrescriptionDoc || !docUrls}
                                    >
                                        View Document
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleDownload(docUrls?.prescription, prescription.prescriptionFileName || `prescription_${prescriptionId}`)}
                                        disabled={loading || !hasPrescriptionDoc || !docUrls}
                                    >
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
                                    {!hasCprDoc && (
                                        <span className="d-block text-muted small">
                                            No file uploaded.
                                        </span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm qp-edit-btn me-2"
                                        onClick={() => handleView(docUrls?.cpr)}
                                        disabled={loading || !hasCprDoc || !docUrls}
                                    >
                                        View Document
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => handleDownload(docUrls?.cpr, prescription.cprFileName || `cpr_${prescriptionId}`)}
                                        disabled={loading || !hasCprDoc || !docUrls}
                                    >
                                        Download Document
                                    </button>
                                </td>
                            </tr>
                        </TableFormat>
                    </div>

                    <div className="text-end mt-4">
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() =>
                                navigate("/healthProfile", {
                                    state: { openPrescriptionTab: true },
                                })
                            }
                            disabled={loading}
                        >
                            Back to Health Profile
                        </button>
                    </div>
                </div>
            </div>

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
