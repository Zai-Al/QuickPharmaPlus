// src/Pages/External_System/PrescriptionItemSection.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import DropDown from "../Shared_Components/DropDown";
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
    onStatusChange,
    showErrors,
    approvedOptions = [],
}) {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const [mode, setMode] = useState("");
    const [selectedExisting, setSelectedExisting] = useState("");
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
    // CITY SEARCH DROPDOWN (same UX as PrescriptionTab.jsx)
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

        // user typing -> clear selected cityId until they pick from list
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

    useEffect(() => {
        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        const numberRegex = /^[0-9]+$/;

        const newErrors = {};

        if (mode === "existing") {
            if (!selectedExisting) newErrors.existing = "Please choose a prescription.";
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
                newErrors.cprFile =
                    "Invalid file type. Only PDF, JPG, or PNG files are allowed.";
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
                usesHealthProfile: mode === "existing",
                selectedPrescriptionId: mode === "existing" ? selectedExisting : null,
                prescriptionFile: mode === "new" ? prescriptionFile : null,
                cprFile: mode === "new" ? cprFile : null,
                address: mode === "new" ? formData : null, 
            };

            onStatusChange(item.id, payload);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, selectedExisting, prescriptionFile, cprFile, formData, showErrors, item.id]);

    return (
        <div className="prescription-container">
            <h4>
                Upload Prescription for <u>{item.name}</u>
            </h4>

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

                    {errors.existing && <div className="invalid-feedback d-block">{errors.existing}</div>}
                </div>
            )}


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
                                className={`form-control ${errors.cprFile ? "is-invalid" : ""}`}
                                onChange={handleFileChange}
                                accept=".pdf,.jpg,.jpeg,.png"
                            />
                            {errors.cprFile && (
                                <div className="invalid-feedback d-block">{errors.cprFile}</div>
                            )}
                        </div>
                    </div>

                    {/* Address (with searchable city dropdown) */}
                    <div className="prescription-address text-start mt-3">
                        <h5 className="fw-bold mb-3">Registered Address</h5>

                        {/* ROW 1: City + Block (side-by-side like PrescriptionTab) */}
                        <div className="row mb-3" ref={cityRef}>
                            {/* City */}
                            <div className="col-md-6 text-start" style={{ position: "relative" }}>
                                <label className="form-label fw-bold">City</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.cityId ? "is-invalid" : ""}`}
                                    value={cityQuery}
                                    placeholder={cities.length === 0 ? "Loading cities..." : "Select city or start typing"}
                                    onChange={handleCityInputChange}
                                    onFocus={handleCityInputFocus}
                                    onKeyDown={handleCityKeyDown}
                                    disabled={cities.length === 0}
                                    autoComplete="off"
                                />
                                {errors.cityId && <div className="invalid-feedback d-block">{errors.cityId}</div>}

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

                            {/* Block */}
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

                        {/* ROW 2: Road + Building/Floor (side-by-side) */}
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
