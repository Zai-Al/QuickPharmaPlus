// src/Pages/External_System/PrescriptionTab.jsx
import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
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

        // ? address
        cityId: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [errors, setErrors] = useState({});
    const [isEditing, setIsEditing] = useState(startInEditMode);
    const [showSaveModal, setShowSaveModal] = useState(false);

    const [existingFiles, setExistingFiles] = useState({
        hasPrescription: false,
        hasCpr: false,
        prescriptionFileName: "",
        cprFileName: "",
    });


    // =========================
    // CITY DROPDOWN (same as ExternalProfile)
    // =========================
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

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
        const map = { 1: "Approved", 2: "Pending Approval", 3: "Expired", 4: "Rejected" };
        return map[statusId] || "Unknown";
    };

    const isEmpty = (v) => !v || String(v).trim() === "";

    // -----------------------------
    // Fetch cities (same endpoint as profile)
    // GET: /api/Cities
    // -----------------------------
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/cities`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Failed to load cities");

                const data = await res.json();
                setCities(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("CITIES LOAD ERROR:", err);
                setCities([]);
            }
        };

        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (cityRef.current && !cityRef.current.contains(e.target)) {
                setShowCityDropdown(false);
                setHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Filter cities by query
    const filteredCities =
        cityQuery && cityQuery.trim().length > 0
            ? (cities || []).filter((c) =>
                String(c.cityName ?? c.CityName ?? "")
                    .toLowerCase()
                    .includes(cityQuery.toLowerCase())
            )
            : cities || [];

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);

        // user is typing -> clear selected cityId (until they pick)
        setFormData((prev) => ({ ...prev, cityId: "" }));

        setErrors((prev) => ({ ...prev, cityId: undefined, city: undefined }));

        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleSelectCity = (city) => {
        const name = city.cityName ?? city.CityName ?? "";
        const id = city.cityId ?? city.CityId ?? "";

        setCityQuery(name);
        setFormData((prev) => ({ ...prev, cityId: String(id) }));

        setShowCityDropdown(false);
        setHighlightIndex(0);

        setErrors((prev) => ({ ...prev, cityId: undefined, city: undefined }));
    };

    const handleCityInputFocus = () => {
        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleCityKeyDown = (e) => {
        if (!showCityDropdown) return;
        const list = filteredCities || [];

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[highlightIndex];
            if (picked) handleSelectCity(picked);
        } else if (e.key === "Escape") {
            setShowCityDropdown(false);
        }
    };

    // -----------------------------
    // Fetch health prescriptions ONLY (raw list)
    // GET: /api/Prescription/user/{userId}
    // -----------------------------
    const fetchPrescriptions = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            setLoadError("");

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
            const items = Array.isArray(data) ? data : [];

            const mapped = items.map((p) => ({
                id: p.prescriptionId,
                name: p.prescriptionName || "",
                creationDate: p.prescriptionCreationDate ? formatDateOnly(p.prescriptionCreationDate) : "",
                statusId: p.prescriptionStatusId,
                status: normalizeStatus(p.prescriptionStatusName, p.prescriptionStatusId),

                // ? address from backend
                addressId: p.addressId ?? null,
                cityId: p.cityId ? String(p.cityId) : "",
                cityName: p.cityName ?? "",
                block: p.block ?? "",
                road: p.road ?? "",
                buildingFloor: p.buildingFloor ?? "",

                hasPrescriptionDocument: !!p.hasPrescriptionDocument,
                hasCprDocument: !!p.hasCprDocument,
                prescriptionFileName: p.prescriptionFileName ?? p.PrescriptionFileName ?? "",
                cprFileName: p.cprFileName ?? p.CprFileName ?? "",


                latestApprovalExpiryDate: p.latestApprovalExpiryDate ? formatDateOnly(p.latestApprovalExpiryDate) : null,

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

            const pid = prescriptionToEdit.id || prescriptionToEdit.prescriptionId || null;

            const cityName =
                prescriptionToEdit.cityName ||
                prescriptionToEdit.city ||
                "";

            const cityId =
                prescriptionToEdit.cityId != null ? String(prescriptionToEdit.cityId) : "";

            setFormData({
                prescriptionId: pid,
                name: prescriptionToEdit.name || prescriptionToEdit.prescriptionName || "",
                prescriptionFile: null,
                cprFile: null,

                cityId: cityId,
                block: prescriptionToEdit.block || "",
                road: prescriptionToEdit.road || "",
                buildingFloor: prescriptionToEdit.buildingFloor || "",
            });

            setCityQuery(cityName);

            setExistingFiles({
                hasPrescription: !!prescriptionToEdit.hasPrescriptionDocument,
                hasCpr: !!prescriptionToEdit.hasCprDocument,
                prescriptionFileName:
                    prescriptionToEdit.prescriptionFileName ??
                    prescriptionToEdit.PrescriptionFileName ??
                    "",
                cprFileName:
                    prescriptionToEdit.cprFileName ??
                    prescriptionToEdit.CprFileName ??
                    "",
            });

        }
    }, [startInEditMode, prescriptionToEdit]);

    // generic change for non-city fields
    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));

        // clear field-level error as user types
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const resetForm = () => {
        setFormData({
            prescriptionId: null,
            name: "",
            prescriptionFile: null,
            cprFile: null,
            cityId: "",
            block: "",
            road: "",
            buildingFloor: "",
        });
        setCityQuery("");
        setErrors({});
        setIsEditing(false);
        setView("list");
        setExistingFiles({ hasPrescription: false, hasCpr: false });
        setShowCityDropdown(false);
        setHighlightIndex(0);
    };

    const handleAddNewClick = () => {
        resetForm();
        setView("form");
    };

    const handleCancel = () => resetForm();

    // -----------------------------
    // Create / Update API (multipart/form-data)
    // -----------------------------
    const createPrescription = async () => {
        const fd = new FormData();
        fd.append("PrescriptionName", formData.name.trim());
        fd.append("CityId", String(formData.cityId));
        fd.append("Block", formData.block.trim());
        fd.append("Road", formData.road.trim());
        fd.append("BuildingFloor", formData.buildingFloor.trim());
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

        // your controller returns { prescriptionId: newId, ... } (or similar)
        return await res.json().catch(() => ({}));
    };


    const updatePrescription = async () => {
        if (!formData.prescriptionId) throw new Error("Missing prescription id.");

        const fd = new FormData();
        fd.append("PrescriptionName", formData.name.trim());

        // ? address fields (update same Address row in backend)
        fd.append("CityId", String(formData.cityId));
        fd.append("Block", formData.block.trim());
        fd.append("Road", formData.road.trim());
        fd.append("BuildingFloor", formData.buildingFloor.trim());

        if (formData.prescriptionFile) fd.append("PrescriptionDocument", formData.prescriptionFile);
        if (formData.cprFile) fd.append("PrescriptionCprDocument", formData.cprFile);

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
        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

        const newErrors = {};

        // name
        if (isEmpty(formData.name)) {
            newErrors.name = "Please enter a prescription name.";
        } else if (formData.name.trim().length < 3) {
            newErrors.name = "Prescription name must be at least 3 characters.";
        } else if (!nameRegex.test(formData.name.trim())) {
            newErrors.name = "Prescription name can only contain letters and numbers.";
        }

        // files
        if (!isEditing) {
            if (!formData.prescriptionFile) {
                newErrors.prescriptionFile = "Please upload your long-term prescription.";
            } else if (!allowedTypes.includes(formData.prescriptionFile.type)) {
                newErrors.prescriptionFile = "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!formData.cprFile) {
                newErrors.cprFile = "Please upload your CPR.";
            } else if (!allowedTypes.includes(formData.cprFile.type)) {
                newErrors.cprFile = "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }
        } else {
            if (formData.prescriptionFile && !allowedTypes.includes(formData.prescriptionFile.type)) {
                newErrors.prescriptionFile = "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }
            if (formData.cprFile && !allowedTypes.includes(formData.cprFile.type)) {
                newErrors.cprFile = "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!formData.prescriptionFile && !existingFiles.hasPrescription) {
                newErrors.prescriptionFile = "Please upload your long-term prescription.";
            }
            if (!formData.cprFile && !existingFiles.hasCpr) {
                newErrors.cprFile = "Please upload your CPR.";
            }
        }

        // ? city must be selected from list => cityId must exist
        if (isEmpty(formData.cityId)) {
            newErrors.cityId = "Please select your city from the list.";
        }

        // block/road/building
        if (isEmpty(formData.block)) newErrors.block = "Please enter your block.";
        else if (!numberRegex.test(formData.block.trim())) newErrors.block = "Block must contain only numbers.";

        if (isEmpty(formData.road)) newErrors.road = "Please enter your road.";
        else if (!numberRegex.test(formData.road.trim())) newErrors.road = "Road / Street must contain numbers only.";

        if (isEmpty(formData.buildingFloor)) newErrors.buildingFloor = "Please enter your building / floor number.";

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

            // show list immediately
            setView("list");
            setIsEditing(false);

            // reload rows from backend so the new one appears
            await fetchPrescriptions();

            // clear form after (so you don't clear before using fields)
            resetForm();
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
        navigate(`/prescriptions/${prescription.id}`);

    };

    // -----------------------------
    // FORM VIEW
    // -----------------------------
    if (view === "form") {
        return (
            <div className="prescription-form">
                <p className="fw-bold mb-4 text-start">
                    If you have a long-term prescription, please upload it below to get approved by a pharmacist.
                    The prescription should include the medication name, dosage, and expiration date.
                    If any information is not presented then the prescription will be rejected.
                </p>

                {errors.submit && <div className="alert alert-danger text-start">{errors.submit}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Prescription Name */}
                    <div className="mb-4 text-start">
                        <label className="form-label fw-bold">Prescription Name</label>
                        <input
                            type="text"
                            name="name"
                            className={`form-control w-50 ${errors.name ? "is-invalid" : ""}`}
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter prescription name"
                        />
                        {errors.name && <div className="invalid-feedback d-block text-start">{errors.name}</div>}
                    </div>

                    {/* Files row */}
                    <div className="row text-start mb-4">
                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">Upload Long-term Prescription</label>
                            <input
                                type="file"
                                name="prescriptionFile"
                                className={`form-control ${errors.prescriptionFile ? "is-invalid" : ""}`}
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {isEditing && existingFiles.hasPrescription && !formData.prescriptionFile && (
                                <div className="form-text text-muted mt-1">
                                    Current file:{" "}
                                    <strong>{existingFiles.prescriptionFileName || "Uploaded"}</strong>
                                </div>
                            )}
                            {errors.prescriptionFile && (
                                <div className="invalid-feedback d-block text-start">{errors.prescriptionFile}</div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <label className="form-label fw-bold">Upload Your CPR</label>
                            <input
                                type="file"
                                name="cprFile"
                                className={`form-control ${errors.cprFile ? "is-invalid" : ""}`}
                                onChange={handleChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {isEditing && existingFiles.hasCpr && !formData.cprFile && (
                                <div className="form-text text-muted mt-1">
                                    Current file:{" "}
                                    <strong>{existingFiles.cprFileName || "Uploaded"}</strong>
                                </div>
                            )}
                            {errors.cprFile && (
                                <div className="invalid-feedback d-block text-start">{errors.cprFile}</div>
                            )}
                        </div>
                    </div>

                    {/* Registered Address (same UX as ExternalProfile) */}
                    <div className="mt-2">
                        <h5 className="fw-bold mb-3 text-start">Registered Address</h5>

                        <div className="row mb-3" ref={cityRef} style={{ position: "relative" }}>
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">City</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.cityId ? "is-invalid" : ""}`}
                                    placeholder={cities.length === 0 ? "Loading cities..." : "Select city or start typing"}
                                    value={cityQuery}
                                    onChange={handleCityInputChange}
                                    onFocus={handleCityInputFocus}
                                    onKeyDown={handleCityKeyDown}
                                    disabled={cities.length === 0}
                                    autoComplete="off"
                                />

                                {showCityDropdown && (filteredCities || []).length > 0 && (
                                    <ul
                                        className="list-group position-absolute w-100"
                                        style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}
                                    >
                                        <li className="list-group-item disabled">Select city</li>
                                        {filteredCities.map((c, idx) => (
                                            <li
                                                key={c.cityId ?? c.CityId ?? idx}
                                                className={`list-group-item list-group-item-action ${idx === highlightIndex ? "active" : ""
                                                    }`}
                                                onMouseDown={(ev) => ev.preventDefault()}
                                                onClick={() => handleSelectCity(c)}
                                                onMouseEnter={() => setHighlightIndex(idx)}
                                            >
                                                {c.cityName ?? c.CityName}
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {errors.cityId && <div className="invalid-feedback d-block">{errors.cityId}</div>}
                            </div>

                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Block</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.block ? "is-invalid" : ""}`}
                                    placeholder="Enter block"
                                    name="block"
                                    value={formData.block}
                                    onChange={handleChange}
                                />
                                {errors.block && <div className="invalid-feedback d-block">{errors.block}</div>}
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Road / Street</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.road ? "is-invalid" : ""}`}
                                    placeholder="Enter road / street"
                                    name="road"
                                    value={formData.road}
                                    onChange={handleChange}
                                />
                                {errors.road && <div className="invalid-feedback d-block">{errors.road}</div>}
                            </div>

                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Building / Floor</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.buildingFloor ? "is-invalid" : ""}`}
                                    placeholder="Enter building / floor"
                                    name="buildingFloor"
                                    value={formData.buildingFloor}
                                    onChange={handleChange}
                                />
                                {errors.buildingFloor && (
                                    <div className="invalid-feedback d-block">{errors.buildingFloor}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <button
                            type="submit"
                            className={`btn px-5 ${isEditing ? "qp-edit-btn" : "qp-add-btn"}`}
                            disabled={loading || !userId}
                        >
                            {isEditing ? "Update Prescription" : "Add Prescription"}
                        </button>

                        <button type="button" className="btn btn-danger px-5" onClick={handleCancel} disabled={loading}>
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
            onAddNew={userId ? handleAddNewClick : undefined}
            addButtonDisabledMessage={
                !userId ? "Login required to add a prescription." : ""
            }

        />
    );
}
