// src/Pages/External_System/PrescriptionItemSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./Checkout.css";

let _citiesCache = null;
let _citiesPromise = null;

async function loadCitiesOnce(API_BASE) {
    if (_citiesCache) return _citiesCache;
    if (_citiesPromise) return _citiesPromise;

    _citiesPromise = (async () => {
        const base = (API_BASE || "").replace(/\/$/, "");
        const res = await fetch(`${base}/api/cities`, {
            method: "GET",
            credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load cities");
        const data = await res.json();
        _citiesCache = Array.isArray(data) ? data : [];
        return _citiesCache;
    })();

    return _citiesPromise;
}

export default function PrescriptionItemSection({
    item,
    userId,
    onStatusChange,
    showErrors,
    approvedOptions = [],
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const [mode, setMode] = useState(""); // "existing" | "code" | "new"
    const [selectedExisting, setSelectedExisting] = useState("");

    // ? approval code mode
    const [approvalCode, setApprovalCode] = useState("");

    const [serverCheck, setServerCheck] = useState({
        checked: false,
        ok: false,
        message: "",
    });
    const [checking, setChecking] = useState(false);

    const validateWithServer = async (prescriptionId, isHealthProfile) => {
        if (!userId) throw new Error("Missing user id.");
        if (!prescriptionId) throw new Error("Missing prescription id.");

        const payload = {
            userId: Number(userId),
            prescriptionId: Number(prescriptionId),
            isHealthProfile: !!isHealthProfile,
            cartItems: [
                {
                    productId: item.productId ?? item.id,
                    name: item.name,
                    requiresPrescription: true,
                    cartQuantity: Number(item.quantity) || 1,
                },
            ],
        };

        const res = await fetch(`${API_BASE}/api/Prescription/checkout/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || `Validation failed (${res.status})`);
        }

        return await res.json();
    };

    // auto-validate for health profile selection
    useEffect(() => {
        const run = async () => {
            if (mode !== "existing") return;

            if (!selectedExisting) {
                setServerCheck({ checked: false, ok: false, message: "" });
                return;
            }

            setChecking(true);
            try {
                const result = await validateWithServer(selectedExisting, true);

                if (result?.isValid) {
                    setServerCheck({
                        checked: true,
                        ok: true,
                        message: "Prescription matched successfully.",
                    });
                } else {
                    setServerCheck({
                        checked: true,
                        ok: false,
                        message: "Prescription does not match this prescribed item.",
                    });
                }
            } catch (e) {
                setServerCheck({
                    checked: true,
                    ok: false,
                    message: e?.message || "Validation failed.",
                });
            } finally {
                setChecking(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, selectedExisting]);

    const [prescriptionFile, setPrescriptionFile] = useState(null);
    const [cprFile, setCprFile] = useState(null);

    const [formData, setFormData] = useState({
        cityId: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [errors, setErrors] = useState({});

    // =========================
    // CITY SEARCH DROPDOWN
    // =========================
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

    useEffect(() => {
        let alive = true;

        loadCitiesOnce(API_BASE)
            .then((list) => {
                if (!alive) return;
                setCities(Array.isArray(list) ? list : []);
            })
            .catch(() => {
                if (!alive) return;
                setCities([]);
            });

        return () => {
            alive = false;
        };
    }, [API_BASE]);

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

    const filteredCities = useMemo(() => {
        const q = (cityQuery || "").trim().toLowerCase();
        if (!q) return cities || [];
        return (cities || []).filter((c) =>
            String(c.cityName ?? c.CityName ?? "")
                .toLowerCase()
                .includes(q)
        );
    }, [cities, cityQuery]);

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);

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

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        const file = files?.[0] || null;

        if (name === "prescriptionFile") setPrescriptionFile(file);
        if (name === "cprFile") setCprFile(file);
    };

    const handleApprovalCodeChange = (e) => {
        const v = e.target.value;
        setApprovalCode(v);
        setErrors((prev) => ({ ...prev, approvalCode: undefined }));
    };

    // ? optional: when switching modes, clear irrelevant fields AND reset server check
    useEffect(() => {
        // reset server check whenever mode changes
        setServerCheck({ checked: false, ok: false, message: "" });
        setChecking(false);

        if (mode !== "existing") setSelectedExisting("");
        if (mode !== "code") setApprovalCode("");

        if (mode !== "new") {
            setPrescriptionFile(null);
            setCprFile(null);
            setFormData({ cityId: "", block: "", road: "", buildingFloor: "" });
            setCityQuery("");
            setShowCityDropdown(false);
            setHighlightIndex(0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

    // VALIDATION + send status upward
    useEffect(() => {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        const numberRegex = /^[0-9]+$/;

        const newErrors = {};

        if (mode === "existing") {
            if (!selectedExisting) newErrors.existing = "Please choose a prescription.";

            // server validation required to proceed
            if (selectedExisting && (!serverCheck.checked || !serverCheck.ok)) {
                newErrors.server = serverCheck.checked
                    ? "Prescription does not match this prescribed item."
                    : "Please wait for validation.";
            }
        } else if (mode === "code") {
            if (!approvalCode.trim()) {
                newErrors.approvalCode = "Please enter the approval code.";
            } else {
                const pid = Number.parseInt(approvalCode.trim(), 10);
                if (!Number.isFinite(pid) || pid <= 0) {
                    newErrors.approvalCode = "Approval code must be a valid number.";
                }
            }

            // server validation required to proceed (after submit)
            if (approvalCode.trim() && (!serverCheck.checked || !serverCheck.ok)) {
                newErrors.server = serverCheck.checked
                    ? "Prescription does not match this prescribed item."
                    : "Please click Submit to validate the code.";
            }
        } else if (mode === "new") {
            if (!prescriptionFile) {
                newErrors.prescriptionFile = "Please upload your long-term prescription.";
            } else if (!allowedTypes.includes(prescriptionFile.type)) {
                newErrors.prescriptionFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!cprFile) {
                newErrors.cprFile = "Please upload your CPR.";
            } else if (!allowedTypes.includes(cprFile.type)) {
                newErrors.cprFile = "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
            }

            if (!formData.cityId) newErrors.cityId = "Please choose your city.";

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
                newErrors.buildingFloor = "Please enter your building / floor number.";
            }
        }

        setErrors((prev) => {
            const next = showErrors ? newErrors : {};
            const prevKeys = Object.keys(prev);
            const nextKeys = Object.keys(next);

            if (prevKeys.length !== nextKeys.length) return next;
            for (const k of nextKeys) {
                if (prev[k] !== next[k]) return next;
            }
            return prev;
        });

        const isValid = !!mode && Object.keys(newErrors).length === 0;

        if (onStatusChange) {
            const payload = {
                isValid,
                mode,

                // backend check state (used by Checkout.jsx)
                backendChecked: serverCheck.checked,
                backendValid: mode === "new" ? true : serverCheck.checked ? serverCheck.ok : false,
                backendMessage: serverCheck.message,

                // existing (health profile)
                usesHealthProfile: mode === "existing",
                selectedPrescriptionId: mode === "existing" ? selectedExisting : null,

                // code mode
                approvalCode: mode === "code" ? approvalCode.trim() : null,

                // new upload
                prescriptionFile: mode === "new" ? prescriptionFile : null,
                cprFile: mode === "new" ? cprFile : null,
                address: mode === "new" ? formData : null,
            };

            onStatusChange(item.id, payload);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mode,
        selectedExisting,
        approvalCode,
        prescriptionFile,
        cprFile,
        formData,
        showErrors,
        item.id,
        serverCheck.checked,
        serverCheck.ok,
        serverCheck.message,
    ]);

    return (
        <div className="prescription-container">
            <h4>
                Upload Prescription for <u>{item.name}</u>
            </h4>

            {/* ===== Existing approved from health profile ===== */}
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

                    <select
                        className={`form-select ${errors.existing ? "is-invalid" : ""}`}
                        value={selectedExisting}
                        onChange={(e) => setSelectedExisting(e.target.value)}
                    >
                        <option value="">Choose from Health Profile</option>
                        {approvedOptions.map((o) => (
                            <option key={o.id} value={String(o.id)}>
                                {o.label}
                            </option>
                        ))}
                    </select>

                    {errors.existing && (
                        <div className="invalid-feedback d-block">{errors.existing}</div>
                    )}

                    {checking && <div className="text-muted small mt-2">Checking...</div>}

                    {serverCheck.checked && (
                        <div className={`small mt-2 ${serverCheck.ok ? "text-success" : "text-danger"}`}>
                            {serverCheck.message}
                        </div>
                    )}

                    
                </div>
            )}

            {/* ===== Approved prescription code ===== */}
            <div className="prescription-option mt-2">
                <input
                    className="form-check-input"
                    type="radio"
                    name={`prescriptionOption-${item.id}`}
                    id={`code-${item.id}`}
                    value="code"
                    checked={mode === "code"}
                    onChange={() => setMode("code")}
                />
                <label htmlFor={`code-${item.id}`}>Have an already approved prescription</label>
            </div>

            {mode === "code" && (
                <div className="prescription-subsection">
                    <label className="form-label fw-bold mt-2">Prescription Approval Code</label>

                    <div className="d-flex align-items-center gap-2">
                        <input
                            type="text"
                            className={`form-control ${errors.approvalCode ? "is-invalid" : ""}`}
                            placeholder="Enter approval code"
                            value={approvalCode}
                            onChange={handleApprovalCodeChange}
                        />

                        <button
                            type="button"
                            className="btn qp-add-btn align-self-stretch"
                            disabled={checking}
                            onClick={async () => {
                                if (!approvalCode.trim()) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        approvalCode: "Please enter the approval code.",
                                    }));
                                    return;
                                }

                                const pid = Number.parseInt(approvalCode.trim(), 10);
                                if (!Number.isFinite(pid) || pid <= 0) {
                                    setErrors((prev) => ({
                                        ...prev,
                                        approvalCode: "Approval code must be a valid number.",
                                    }));
                                    return;
                                }

                                setErrors((prev) => ({ ...prev, approvalCode: undefined }));
                                setChecking(true);

                                try {
                                    const result = await validateWithServer(pid, false);

                                    if (result?.isValid) {
                                        setServerCheck({
                                            checked: true,
                                            ok: true,
                                            message: "Prescription matched successfully.",
                                        });
                                    } else {
                                        setServerCheck({
                                            checked: true,
                                            ok: false,
                                            message: "Prescription does not match this prescribed item.",
                                        });
                                    }
                                } catch (e) {
                                    setServerCheck({
                                        checked: true,
                                        ok: false,
                                        message: e?.message || "Validation failed.",
                                    });
                                } finally {
                                    setChecking(false);
                                }
                            }}
                        >
                            Submit
                        </button>
                    </div>

                    {errors.approvalCode && (
                        <div className="invalid-feedback d-block">{errors.approvalCode}</div>
                    )}

                    {checking && <div className="text-muted small mt-2">Checking...</div>}

                    {serverCheck.checked && (
                        <div className={`small mt-2 ${serverCheck.ok ? "text-success" : "text-danger"}`}>
                            {serverCheck.message}
                        </div>
                    )}

                </div>
            )}

            {/* ===== New upload ===== */}
            <div className="prescription-option mt-2">
                <input
                    className="form-check-input"
                    type="radio"
                    name={`prescriptionOption-${item.id}`}
                    id={`new-${item.id}`}
                    value="new"
                    checked={mode === "new"}
                    onChange={() => setMode("new")}
                />
                <label htmlFor={`new-${item.id}`}>Upload New Prescription</label>
            </div>

            {mode === "new" && (
                <>
                    <div className="prescription-subsection">
                        <div className="mb-4">
                            <label className="form-label fw-bold">Upload Prescription</label>
                            <input
                                type="file"
                                name="prescriptionFile"
                                className={`form-control ${errors.prescriptionFile ? "is-invalid" : ""}`}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {errors.prescriptionFile && (
                                <div className="invalid-feedback d-block">{errors.prescriptionFile}</div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Upload a Picture of Your CPR</label>
                            <input
                                type="file"
                                name="cprFile"
                                className={`form-control ${errors.cprFile ? "is-invalid" : ""}`}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {errors.cprFile && (
                                <div className="invalid-feedback d-block">{errors.cprFile}</div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="prescription-address text-start mt-3">
                        <h5 className="fw-bold mb-3">Registered Address</h5>

                        <div className="row mb-3" ref={cityRef}>
                            <div className="col-md-6 text-start" style={{ position: "relative" }}>
                                <label className="form-label fw-bold">City</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.cityId ? "is-invalid" : ""}`}
                                    value={cityQuery}
                                    placeholder={
                                        cities.length === 0 ? "Loading cities..." : "Select city or start typing"
                                    }
                                    onChange={handleCityInputChange}
                                    onFocus={handleCityInputFocus}
                                    onKeyDown={handleCityKeyDown}
                                    disabled={cities.length === 0}
                                    autoComplete="off"
                                />
                                {errors.cityId && (
                                    <div className="invalid-feedback d-block">{errors.cityId}</div>
                                )}

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
                            </div>

                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Block</label>
                                <input
                                    type="text"
                                    name="block"
                                    className={`form-control ${errors.block ? "is-invalid" : ""}`}
                                    placeholder="Enter block"
                                    value={formData.block}
                                    onChange={handleAddressChange}
                                />
                                {errors.block && <div className="invalid-feedback d-block">{errors.block}</div>}
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Road / Street</label>
                                <input
                                    type="text"
                                    name="road"
                                    className={`form-control ${errors.road ? "is-invalid" : ""}`}
                                    placeholder="Enter road / street"
                                    value={formData.road}
                                    onChange={handleAddressChange}
                                />
                                {errors.road && <div className="invalid-feedback d-block">{errors.road}</div>}
                            </div>

                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Building / Floor</label>
                                <input
                                    type="text"
                                    name="buildingFloor"
                                    className={`form-control ${errors.buildingFloor ? "is-invalid" : ""}`}
                                    placeholder="Enter building / floor"
                                    value={formData.buildingFloor}
                                    onChange={handleAddressChange}
                                />
                                {errors.buildingFloor && (
                                    <div className="invalid-feedback d-block">{errors.buildingFloor}</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="prescription-divider" />
        </div>
    );
}
