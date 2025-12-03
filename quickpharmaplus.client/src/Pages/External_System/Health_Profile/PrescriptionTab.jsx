// src/Pages/External_System/PrescriptionTab.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AddressFields from "../Shared_Components/AddressFields";
import DialogModal from "../Shared_Components/DialogModal";
import { StatusBadge } from "../Shared_Components/statusUI";
import PrescriptionListView from "../Shared_Components/PrescriptionListView";

export default function PrescriptionTab({
    onSuccess,
    startInEditMode = false,
    prescriptionToEdit = null,
}) {
    const [view, setView] = useState(startInEditMode ? "form" : "list");
    const [prescriptions, setPrescriptions] = useState([]);

    const [formData, setFormData] = useState({
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

    // For edit mode: keep track of existing file names
    const [existingFiles, setExistingFiles] = useState({
        prescriptionFileName: "",
        cprFileName: "",
    });

    const navigate = useNavigate();

    // When editing, pre-fill fields & existing file names
    useEffect(() => {
        if (startInEditMode && prescriptionToEdit) {
            setView("form");
            setIsEditing(true);

            setFormData({
                name: prescriptionToEdit.name || "",
                prescriptionFile: null, // cannot prefill actual file input
                cprFile: null,
                city: prescriptionToEdit.city || "",
                block: prescriptionToEdit.block || "",
                road: prescriptionToEdit.road || "",
                buildingFloor: prescriptionToEdit.buildingFloor || "",
            });

            setExistingFiles({
                prescriptionFileName: prescriptionToEdit.prescriptionFileName || "",
                cprFileName: prescriptionToEdit.cprFileName || "",
            });
        }
    }, [startInEditMode, prescriptionToEdit]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value, // handles file + text
        }));
    };

    const resetForm = () => {
        setFormData({
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
        setExistingFiles({
            prescriptionFileName: "",
            cprFileName: "",
        });
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleCancel = () => {
        resetForm();
    };

    const handleSubmit = (e) => {
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

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = "Please enter a prescription name.";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Prescription name must be at least 3 characters.";
        } else if (!nameRegex.test(formData.name.trim())) {
            newErrors.name =
                "Prescription name can only contain letters and numbers.";
        }

        // Prescription file validation:
        // Must exist either as a new file or an existing one from edit mode
        if (!formData.prescriptionFile && !existingFiles.prescriptionFileName) {
            newErrors.prescriptionFile = "Please upload your long-term prescription.";
        } else if (
            formData.prescriptionFile &&
            !allowedTypes.includes(formData.prescriptionFile.type)
        ) {
            newErrors.prescriptionFile =
                "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
        }

        // CPR validation
        if (!formData.cprFile && !existingFiles.cprFileName) {
            newErrors.cprFile = "Please upload your CPR.";
        } else if (
            formData.cprFile &&
            !allowedTypes.includes(formData.cprFile.type)
        ) {
            newErrors.cprFile =
                "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
        }

        // Address validation
        if (!formData.city) {
            newErrors.city = "Please enter your city.";
        }

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

        // Editing flow – show confirmation modal
        if (isEditing) {
            setShowSaveModal(true);
            return;
        }

        // Creating new prescription (local mock)
        const today = new Date();
        const formattedDate = today.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });

        const newPrescription = {
            id: Date.now(), // temp id for routing
            name: formData.name.trim(),
            creationDate: formattedDate,
            status: "Pending Approval",
            city: formData.city,
            block: formData.block,
            road: formData.road,
            buildingFloor: formData.buildingFloor,
            prescriptionFileName:
                formData.prescriptionFile?.name ||
                existingFiles.prescriptionFileName ||
                "",
            cprFileName:
                formData.cprFile?.name || existingFiles.cprFileName || "",
        };

        setPrescriptions((prev) => [...prev, newPrescription]);

        if (typeof onSuccess === "function") {
            onSuccess("Prescription submitted for approval successfully!");
        }

        resetForm();
    };

    const handleConfirmSaveChanges = () => {
        setShowSaveModal(false);

        // TODO: replace with real update (API or lifted state)
        if (typeof onSuccess === "function") {
            onSuccess("Prescription updated successfully!");
        }

        resetForm();
    };

    const handleCancelSaveChanges = () => {
        setShowSaveModal(false);
    };

    const handleViewDetails = (index) => {
        const prescription = prescriptions[index];
        navigate(`/prescriptions/${prescription.id}`, {
            state: { prescription },
        });
    };

    // ============== FORM VIEW ==============
    if (view === "form") {
        return (
            <div className="prescription-form">
                <p className="fw-bold mb-4 text-start">
                    If you have a long-term prescription, please upload it below to get
                    approved by a pharmacist. The prescription should include the
                    medication name, dosage, and expiration date. If any information is
                    not presented then the prescription will be rejected.
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Prescription Name */}
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

                    {/* Files row */}
                    <div className="row text-start mb-4">
                        {/* Prescription file */}
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

                            {/* Show existing file name (edit mode) */}
                            {existingFiles.prescriptionFileName &&
                                !formData.prescriptionFile && (
                                    <div className="form-text text-muted mt-1">
                                        Current file:{" "}
                                        <strong>
                                            {existingFiles.prescriptionFileName}
                                        </strong>{" "}
                                    </div>
                                )}

                            {errors.prescriptionFile && (
                                <div className="invalid-feedback d-block text-start">
                                    {errors.prescriptionFile}
                                </div>
                            )}
                        </div>

                        {/* CPR file */}
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

                            {existingFiles.cprFileName && !formData.cprFile && (
                                <div className="form-text text-muted mt-1">
                                    Current file:{" "}
                                    <strong>{existingFiles.cprFileName}</strong> 
                                </div>
                            )}

                            {errors.cprFile && (
                                <div className="invalid-feedback d-block text-start">
                                    {errors.cprFile}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address section with spacing below files */}
                    <div className="mt-2">
                        <AddressFields
                            title="Registered Address"
                            formData={formData}
                            errors={errors}
                            handleChange={handleChange}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <button type="submit" className={`btn px-5 ${isEditing ? "qp-edit-btn" : "qp-add-btn"
                            }`}>
                            {isEditing ? "Update Prescription" : "Add Prescription"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-5"
                            onClick={handleCancel}
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

    // ============== LIST VIEW ==============
    if (view === "list") {
        return (
            <PrescriptionListView
                description={
                    "If you have a long-term prescription, please upload it below to get approved by a pharmacist. " +
                    "The prescription should include the medication name, dosage, and expiration date. " +
                    "If any information is not presented then the prescription will be rejected."
                }
                title="Prescriptions"
                items={prescriptions.map((p) => ({
                    ...p,
                    statusDisplay: <StatusBadge  status={p.status} />,
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
                    >
                        View Prescription Details
                    </button>
                )}
                addButtonLabel="Add New Prescription"
                onAddNew={handleAddNewClick}
            />
        );
    }

    return null;
}
