// src/Pages/External_System/PrescriptionTab.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AddressFields from "../Shared_Components/AddressFields";
import DialogModal from "../Shared_Components/DialogModal";
import { StatusBadge } from "../Shared_Components/statusUI";
import PrescriptionListView from "../Shared_Components/PrescriptionListView";
import { AuthContext } from "../../../Context/AuthContext.jsx";

export default function PrescriptionTab({
    onSuccess,
    startInEditMode = false,
    prescriptionToEdit = null,
}) {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const API_BASE =
        import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const userId = user?.userId || user?.id;

    const [view, setView] = useState(startInEditMode ? "form" : "list");
    const [prescriptions, setPrescriptions] = useState([]);

    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const [formData, setFormData] = useState({
        prescriptionId: null,
        name: "",
        prescriptionFile: null,
        cprFile: null,
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(startInEditMode);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // backend stores only bytes, so we display "Uploaded" if present
    const [existingFiles, setExistingFiles] = useState({
        hasPrescription: false,
        hasCpr: false,
    });

    // -----------------------------
    // Helpers
    // -----------------------------
    const formatDateOnly = (dateOnly) => {
        if (!dateOnly) return "";
        try {
            const [y, m, d] = String(dateOnly).split("-").map(Number);
            const dt = new Date(y, m - 1, d);
            return dt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
            });
        } catch {
            return String(dateOnly);
        }
    };

    const normalizeStatus = (statusName, statusId) => {
        if (statusName) return statusName;
        const map = {
            1: "Approved",
            2: "Pending Approval",
            3: "Expired",
            4: "Rejected",
        };
        return map[statusId] || "Unknown";
    };

    // -----------------------------
    // Fetch health prescriptions ONLY
    // Backend now enforces: health-only + no pagination + returns raw list
    // GET: /api/Prescription/user/{userId}
    // -----------------------------
    const fetchPrescriptions = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setLoadError("");

            const res = await fetch(
                `${API_BASE}/api/Prescription/user/${userId}`,
                {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to load prescriptions.");
            }

            const data = await res.json();

            // ? backend returns raw list now
            const items = Array.isArray(data) ? data : [];

            const mapped = items.map((p) => ({
                id: p.prescriptionId,
                name: p.prescriptionName || "",
                creationDate: p.prescriptionCreationDate
                    ? formatDateOnly(p.prescriptionCreationDate)
                    : "",
                statusId: p.prescriptionStatusId,
                status: normalizeStatus(p.prescriptionStatusName, p.prescriptionStatusId),

                // UI-only address fields
                city: "",
                block: "",
                road: "",
                buildingFloor: "",

                hasPrescriptionDocument: !!p.hasPrescriptionDocument,
                hasCprDocument: !!p.hasCprDocument,

                latestApprovalExpiryDate: p.latestApprovalExpiryDate
                    ? formatDateOnly(p.latestApprovalExpiryDate)
                    : null,
            }));

            setPrescriptions(mapped);
        } catch (err) {
            setLoadError(err?.message || "Failed to load prescriptions.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // -----------------------------
    // When editing (from details page)
    // -----------------------------
    useEffect(() => {
        if (startInEditMode && prescriptionToEdit) {
            setView("form");
            setIsEditing(true);

            setFormData({
                prescriptionId:
                    prescriptionToEdit.id || prescriptionToEdit.prescriptionId || null,
                name: prescriptionToEdit.name || "",
                prescriptionFile: null,
                cprFile: null,

                city: prescriptionToEdit.city || "",
                block: prescriptionToEdit.block || "",
                road: prescriptionToEdit.road || "",
                buildingFloor: prescriptionToEdit.buildingFloor || "",
            });

            setExistingFiles({
                hasPrescription: !!prescriptionToEdit.hasPrescriptionDocument,
                hasCpr: !!prescriptionToEdit.hasCprDocument,
            });
        }
    }, [startInEditMode, prescriptionToEdit]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const resetForm = () => {
        setFormData({
            prescriptionId: null,
            name: "",
            prescriptionFile: null,
            cprFile: null,
            city: "",
            block: "",
            road: "",
            buildingFloor: "",
        });
        setErrors({});
        setIsEditing(false);
        setView("list");
        setExistingFiles({ hasPrescription: false, hasCpr: false });
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleCancel = () => resetForm();

    // -----------------------------
    // Create / Update API (multipart/form-data)
    // Backend forces IsHealthPerscription = true anyway
    // -----------------------------
    const createPrescription = async () => {
        const fd = new FormData();
        fd.append("PrescriptionName", formData.name.trim());

        // Optional: backend already forces health
        // fd.append("IsHealthPerscription", "true");

        fd.append("PrescriptionDocument", formData.prescriptionFile);
        fd.append("PrescriptionCprDocument", formData.cprFile);

        const res = await fetch(`${API_BASE}/api/Prescription/user/${userId}`, {
            method: "POST",
            credentials: "include",
            body: fd,
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Failed to create prescription.");
        }
    };

    const updatePrescription = async () => {
        if (!formData.prescriptionId) throw new Error("Missing prescription id.");

        const fd = new FormData();
        fd.append("PrescriptionName", formData.name.trim());

        // Optional: backend already forces health
        // fd.append("IsHealthPerscription", "true");

        if (formData.prescriptionFile)
            fd.append("PrescriptionDocument", formData.prescriptionFile);
        if (formData.cprFile)
            fd.append("PrescriptionCprDocument", formData.cprFile);

        const res = await fetch(
            `${API_BASE}/api/Prescription/user/${userId}/${formData.prescriptionId}`,
            {
                method: "PUT",
                credentials: "include",
                body: fd,
            }
        );

        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || "Failed to update prescription.");
        }
    };

    // -----------------------------
    // Submit
    // -----------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        const nameRegex = /^[A-Za-z0-9 ]+$/;
        const numberRegex = /^[0-9]+$/;
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
        ];

        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Please enter a prescription name.";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Prescription name must be at least 3 characters.";
        } else if (!nameRegex.test(formData.name.trim())) {
            newErrors.name =
                "Prescription name can only contain letters and numbers.";
        }

        if (!isEditing) {
            if (!formData.prescriptionFile) {
                newErrors.prescriptionFile =
                    "Please upload your long-term prescription.";
            } else if (!allowedTypes.includes(formData.prescriptionFile.type)) {
                newErrors.prescriptionFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!formData.cprFile) {
                newErrors.cprFile = "Please upload your CPR.";
            } else if (!allowedTypes.includes(formData.cprFile.type)) {
                newErrors.cprFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }
        } else {
            if (
                formData.prescriptionFile &&
                !allowedTypes.includes(formData.prescriptionFile.type)
            ) {
                newErrors.prescriptionFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }
            if (formData.cprFile && !allowedTypes.includes(formData.cprFile.type)) {
                newErrors.cprFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!formData.prescriptionFile && !existingFiles.hasPrescription) {
                newErrors.prescriptionFile =
                    "Please upload your long-term prescription.";
            }
            if (!formData.cprFile && !existingFiles.hasCpr) {
                newErrors.cprFile = "Please upload your CPR.";
            }
        }

        // Address validation (UI-only)
        if (!formData.city) newErrors.city = "Please enter your city.";

        if (!formData.block.trim()) {
            newErrors.block = "Please enter your block.";
        } else if (!numberRegex.test(formData.block.trim())) {
            newErrors.block = "Block must contain only numbers.";
        }

        if (!formData.road.trim()) {
            newErrors.road = "Please enter your road.";
        } else if (!numberRegex.test(formData.road.trim())) {
            newErrors.road = "Road must contain only numbers.";
        }

        if (!formData.buildingFloor.trim()) {
            newErrors.buildingFloor =
                "Please enter your building / floor number.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (isEditing) {
            setShowSaveModal(true);
            return;
        }

        try {
            setLoading(true);
            await createPrescription();

            if (typeof onSuccess === "function") {
                onSuccess("Prescription submitted for approval successfully!");
            }

            resetForm();
            await fetchPrescriptions();
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                submit: err?.message || "Failed to create prescription.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSaveChanges = async () => {
        setShowSaveModal(false);

        try {
            setLoading(true);
            await updatePrescription();

            if (typeof onSuccess === "function") {
                onSuccess("Prescription updated successfully!");
            }

            resetForm();
            await fetchPrescriptions();
        } catch (err) {
            setErrors((prev) => ({
                ...prev,
                submit: err?.message || "Failed to update prescription.",
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSaveChanges = () => setShowSaveModal(false);

    const handleViewDetails = (index) => {
        const prescription = prescriptions[index];
        navigate(`/prescriptions/${prescription.id}`, {
            state: { prescription, userId },
        });
    };

    // -----------------------------
    // FORM VIEW
    // -----------------------------
    if (view === "form") {
        return (
            <div className="prescription-form">
                <p className="fw-bold mb-4 text-start">
                    If you have a long-term prescription, please upload it below
                    to get approved by a pharmacist. The prescription should include
                    the medication name, dosage, and expiration date. If any
                    information is not presented then the prescription will be rejected.
                </p>

                {errors.submit && (
                    <div className="alert alert-danger text-start">
                        {errors.submit}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4 text-start">
                        <label className="form-label fw-bold">Prescription Name</label>

                        <input
                            type="text"
                            name="name"
                            className={`form-control w-50 ${errors.name ? "is-invalid" : ""
                                }`}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter prescription name"
                        />

                        {errors.name && (
                            <div className="invalid-feedback d-block text-start">
                                {errors.name}
                            </div>
                        )}
                    </div>

                    <div className="row text-start mb-4">
                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">
                                Upload Long-term Prescription
                            </label>
                            <input
                                type="file"
                                name="prescriptionFile"
                                className={`form-control ${errors.prescriptionFile ? "is-invalid" : ""
                                    }`}
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                            {isEditing &&
                                existingFiles.hasPrescription &&
                                !formData.prescriptionFile && (
                                    <div className="form-text text-muted mt-1">
                                        Current file: <strong>Uploaded</strong>
                                    </div>
                                )}

                            {errors.prescriptionFile && (
                                <div className="invalid-feedback d-block text-start">
                                    {errors.prescriptionFile}
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">Upload Your CPR</label>
                            <input
                                type="file"
                                name="cprFile"
                                className={`form-control ${errors.cprFile ? "is-invalid" : ""
                                    }`}
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />

                            {isEditing && existingFiles.hasCpr && !formData.cprFile && (
                                <div className="form-text text-muted mt-1">
                                    Current file: <strong>Uploaded</strong>
                                </div>
                            )}

                            {errors.cprFile && (
                                <div className="invalid-feedback d-block text-start">
                                    {errors.cprFile}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-2">
                        <AddressFields
                            title="Registered Address"
                            formData={formData}
                            errors={errors}
                            handleChange={handleChange}
                        />
                    </div>

                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <button
                            type="submit"
                            className={`btn px-5 ${isEditing ? "qp-edit-btn" : "qp-add-btn"
                                }`}
                            disabled={loading || !userId}
                        >
                            {isEditing ? "Update Prescription" : "Add Prescription"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-5"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                <DialogModal
                    show={showSaveModal}
                    title="Save Changes?"
                    body="Are you sure you want to save the changes to this prescription?"
                    confirmLabel="Save Changes"
                    cancelLabel="Cancel"
                    onConfirm={handleConfirmSaveChanges}
                    onCancel={handleCancelSaveChanges}
                />
            </div>
        );
    }

    // -----------------------------
    // LIST VIEW
    // -----------------------------
    return (
        <PrescriptionListView
            description={
                "If you have a long-term prescription, please upload it below to get approved by a pharmacist. " +
                "The prescription should include the medication name, dosage, and expiration date. " +
                "If any information is not presented then the prescription will be rejected."
            }
            title="Prescriptions"
            loading={loading}
            error={loadError}
            items={prescriptions.map((p) => ({
                ...p,
                statusDisplay: <StatusBadge status={p.status} />,
            }))}
            columns={[
                { key: "name", header: "Prescription Name" },
                { key: "creationDate", header: "Creation Date" },
                { key: "statusDisplay", header: "Status" },
            ]}
            emptyMessage="No prescription added to the system."
            renderActions={(_, index) => (
                <button
                    className="btn btn-sm qp-edit-btn"
                    style={{ width: "160px" }}
                    onClick={() => handleViewDetails(index)}
                    disabled={loading}
                >
                    View Prescription Details
                </button>
            )}
            addButtonLabel="Add New Prescription"
            onAddNew={handleAddNewClick}
        />
    );
}
