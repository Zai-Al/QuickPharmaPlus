// src/Pages/External_System/CheckoutPrescriptionTab.jsx
import { useState, useEffect } from "react";
import PrescriptionItemSection from "./PrescriptionItemSection";

export default function CheckoutPrescriptionTab({
    items = [],
    onStateChange,
    showErrors,
}) {
    const prescribedItems = items.filter((item) => item.prescribed);
    const [sectionStatus, setSectionStatus] = useState({});

    const handleStatusChange = (itemId, status) => {
        setSectionStatus((prev) => ({
            ...prev,
            [itemId]: status,
        }));
    };

    useEffect(() => {
        if (!prescribedItems.length) {
            onStateChange?.({ allValid: true, anyNewUpload: false });
            return;
        }

        const allValid = prescribedItems.every(
            (item) => sectionStatus[item.id]?.isValid
        );
        const anyNewUpload = prescribedItems.some(
            (item) => sectionStatus[item.id]?.mode === "new"
        );

        onStateChange?.({ allValid, anyNewUpload });
    }, [prescribedItems, sectionStatus, onStateChange]);

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

            {prescribedItems.map((item) => (
                <PrescriptionItemSection
                    key={item.id}
                    item={item}
                    onStatusChange={handleStatusChange}
                    showErrors={showErrors}
                />
            ))}
        </div>
    );
}
