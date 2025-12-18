// src/Pages/External_System/CheckoutPrescriptionTab.jsx
import { useState, useEffect, useMemo } from "react";
import PrescriptionItemSection from "./PrescriptionItemSection";

export default function CheckoutPrescriptionTab({
    items = [],
    userId,
    onStateChange,
    showErrors,
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const prescribedItems = useMemo(
        () => (items || []).filter((item) => item.prescribed),
        [items]
    );

    const [sectionStatus, setSectionStatus] = useState({});

    // ? load approved prescriptions from health profile
    const [approvedOptions, setApprovedOptions] = useState([]);
    const [approvedLoadError, setApprovedLoadError] = useState("");

    useEffect(() => {
        const fetchApproved = async () => {
            if (!userId) {
                setApprovedOptions([]);
                return;
            }

            try {
                setApprovedLoadError("");

                const res = await fetch(`${API_BASE}/api/Prescription/user/${userId}/health`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || "Failed to load prescriptions.");
                }

                const data = await res.json();
                const list = Array.isArray(data) ? data : [];

                // ? keep ONLY approved
                const approved = list.filter((p) => {
                    const statusId = p.prescriptionStatusId ?? p.PrescriptionStatusId;
                    const statusName = (p.prescriptionStatusName ?? p.PrescriptionStatusName ?? "").toLowerCase();
                    return statusId === 1 || statusName === "approved";
                });

                // ? options must include id + label
                const opts = approved.map((p) => ({
                    id: p.prescriptionId ?? p.PrescriptionId,
                    label: p.prescriptionName ?? p.PrescriptionName ?? `Prescription #${p.prescriptionId}`,
                }));

                setApprovedOptions(opts);
            } catch (e) {
                setApprovedOptions([]);
                setApprovedLoadError(e?.message || "Failed to load approved prescriptions.");
            }
        };

        fetchApproved();
    }, [API_BASE, userId]);

    const handleStatusChange = (itemId, status) => {
        setSectionStatus((prev) => ({
            ...prev,
            [itemId]: status,
        }));
    };

    const { allValid, anyNewUpload } = useMemo(() => {
        if (!prescribedItems.length) return { allValid: true, anyNewUpload: false };

        const allValidLocal = prescribedItems.every((item) => sectionStatus[item.id]?.isValid);
        const anyNewUploadLocal = prescribedItems.some((item) => sectionStatus[item.id]?.mode === "new");

        return { allValid: allValidLocal, anyNewUpload: anyNewUploadLocal };
    }, [prescribedItems, sectionStatus]);

    useEffect(() => {
        onStateChange?.({ allValid, anyNewUpload, sections: sectionStatus });
    }, [allValid, anyNewUpload, sectionStatus, onStateChange]);

    if (!prescribedItems.length) {
        return (
            <div className="text-start">
                <h3 className="fw-bold mb-3 text-center">Prescription</h3>
                <p className="text-muted">
                    There are no medications in this order that require a prescription.
                </p>
            </div>
        );
    }

    return (
        <div className="text-start">
            <h3 className="fw-bold mb-3 text-center">Prescription</h3>

            {/* optional warning (won’t block upload-new mode) */}
            {approvedLoadError && (
                <div className="alert alert-warning text-start">
                    {approvedLoadError}
                </div>
            )}

            {prescribedItems.map((item) => (
                <PrescriptionItemSection
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    showErrors={showErrors}
                    approvedOptions={approvedOptions}
                />
            ))}
        </div>
    );
}
