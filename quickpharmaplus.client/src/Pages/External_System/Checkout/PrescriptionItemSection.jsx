// src/Pages/External_System/PrescriptionItemSection.jsx
import { useState, useEffect } from "react";
import AddressFields from "../Shared_Components/AddressFields";
import DropDown from "../Shared_Components/DropDown";
import "./Checkout.css";

export default function PrescriptionItemSection({
    item,
    onStatusChange,
    showErrors,
}) {
    const [mode, setMode] = useState(""); // "", "existing", "new"
    const [selectedExisting, setSelectedExisting] = useState("");
    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [cprFile, setCprFile] = useState(null);

    const [formData, setFormData] = useState({
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [errors, setErrors] = useState({});

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files?.[0] || null;

        if (name === "prescriptionFile") setPrescriptionFile(file);
        if (name === "cprFile") setCprFile(file);
    };

    // ===== VALIDATION (same rules as PrescriptionTab, adapted here) =====
    useEffect(() => {
        const allowedTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
        ];
        const numberRegex = /^[0-9]+$/;

        const newErrors = {};

        if (mode === "existing") {
            // must choose a prescription from health profile
            if (!selectedExisting) {
                newErrors.existing = "Please choose a prescription.";
            }
        } else if (mode === "new") {
            // Prescription file validation
            if (!prescriptionFile) {
                newErrors.prescriptionFile =
                    "Please upload your long-term prescription.";
            } else if (!allowedTypes.includes(prescriptionFile.type)) {
                newErrors.prescriptionFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            // CPR validation
            if (!cprFile) {
                newErrors.cprFile = "Please upload your CPR.";
            } else if (!allowedTypes.includes(cprFile.type)) {
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
        }

        // Only show errors on the UI when the parent tells us to
        setErrors(showErrors ? newErrors : {});

        const isValid = !!mode && Object.keys(newErrors).length === 0;

        // Inform parent (CheckoutPrescriptionTab) about validity + mode
        if (onStatusChange) {
            onStatusChange(item.id, {
                isValid,
                mode, // "", "existing", "new"
                usesHealthProfile: mode === "existing",
            });
        }
        
    }, [mode, selectedExisting, prescriptionFile, cprFile, formData, showErrors, item.id]);

    return (
        <div className="prescription-container">
            <h4>
                Upload Prescription for <u>{item.name}</u>
            </h4>

            {/* Option 1 */}
            <div className="prescription-option">
                <input
                    className="form-check-input"
                    type="radio"
                    name={`prescriptionOption-${item.id}`}
                    id={`existing-${item.id}`}
                    value="existing"
                    checked={mode === "existing"}
                    onChange={() => setMode("existing")}
                />
                <label htmlFor={`existing-${item.id}`}>
                    Use Already Uploaded Prescription from Health Profile
                </label>
            </div>

            {mode === "existing" && (
                <div className="prescription-subsection">
                    <p className="text-danger small mt-2">
                        *only approved prescriptions from health profile are shown
                    </p>

                    <DropDown
                        name={`existing-prescription-${item.id}`}
                        value={selectedExisting}
                        onChange={(e) =>
                            setSelectedExisting(e.target.value)
                        }
                        placeholder="Choose from Health Profile"
                        options={[
                            "Prescription #1 (example)",
                            "Prescription #2 (example)",
                        ]}
                        error={errors.existing}
                    />
                </div>
            )}

            {/* Option 2 */}
            <div className="prescription-option">
                <input
                    className="form-check-input"
                    type="radio"
                    name={`prescriptionOption-${item.id}`}
                    id={`new-${item.id}`}
                    value="new"
                    checked={mode === "new"}
                    onChange={() => setMode("new")}
                />
                <label htmlFor={`new-${item.id}`}>
                    Upload New Prescription
                </label>
            </div>

            {mode === "new" && (
                <>
                    {/* uploads block */}
                    <div className="prescription-subsection">
                        <div className="mb-4">
                            <label className="form-label fw-bold">
                                Upload Prescription
                            </label>
                            <input
                                type="file"
                                name="prescriptionFile"
                                className={`form-control ${errors.prescriptionFile ? "is-invalid" : ""
                                    }`}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {errors.prescriptionFile && (
                                <div className="invalid-feedback d-block">
                                    {errors.prescriptionFile}
                                </div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">
                                Upload a Picture of Your CPR
                            </label>
                            <input
                                type="file"
                                name="cprFile"
                                className={`form-control ${errors.cprFile ? "is-invalid" : ""
                                    }`}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {errors.cprFile && (
                                <div className="invalid-feedback d-block">
                                    {errors.cprFile}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* registered address block (separate) */}
                    <div className="prescription-address">
                        <AddressFields
                            title="Registered Address"
                            formData={formData}
                            errors={errors}
                            handleChange={handleAddressChange}
                        />
                    </div>
                </>
            )}

            <div className="prescription-divider" />
        </div>
    );
}
