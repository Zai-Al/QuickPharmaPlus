import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AddSupplier.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function AddSupplier() {
    const navigate = useNavigate();

    // =================== STATE ===================
    const [supplierName, setSupplierName] = useState("");
    const [repName, setRepName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [email, setEmail] = useState("");

    const [city, setCity] = useState("");
    const [block, setBlock] = useState("");
    const [road, setRoad] = useState("");
    const [building, setBuilding] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== DROPDOWN OPTIONS ===================
    const [cityOptions, setCityOptions] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);

    // =================== SEARCHABLE CITY DROPDOWN ===================
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [cityHighlightIndex, setCityHighlightIndex] = useState(0);
    const cityRef = useRef(null);

    // =================== VALIDATION PATTERNS ===================
    const namePattern = /^[A-Za-z\s.-]+$/;  // Letters, spaces, dots, and dash
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phonePattern = /^[0-9+\s-]+$/;  // Numbers, +, spaces, and dash
    const blockPattern = /^[0-9]+$/;  // Numbers only
    const roadPattern = /^[A-Za-z0-9\s/.-]+$/;  // Letters, numbers, space, slash, dot, dash
    const buildingPattern = /^[0-9]+$/;  // Numbers only

    // =================== FETCH DATA ON MOUNT ===================
    useEffect(() => {
        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close city dropdown on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (cityRef.current && !cityRef.current.contains(e.target)) {
                setShowCityDropdown(false);
                setCityHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // =================== FETCH FUNCTIONS ===================
    const fetchCities = async () => {
        try {
            setLoadingCities(true);
            const response = await fetch(`/api/cities`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch cities");

            const data = await response.json();
            const options = (data || []).map((c) => ({
                value: c.cityId,
                label: c.cityName ?? c.CityName,
                cityName: c.cityName ?? c.CityName
            }));
            setCityOptions(options);
        } catch (err) {
            console.error("Error fetching cities:", err);
            setErrorMessage("Failed to load cities.");
        } finally {
            setLoadingCities(false);
        }
    };

    // =================== VALIDATION FUNCTIONS ===================
    const validateSupplierName = (value) => {
        if (!value.trim()) return "Supplier name is required.";
        if (value.trim().length < 3) return "Supplier name must be at least 3 characters.";
        if (!namePattern.test(value.trim())) {
            return "Supplier name can only contain letters, spaces, dots (.), and dashes (-).";
        }
        return "";
    };

    const validateRepName = (value) => {
        if (!value.trim()) return "Representative name is required.";
        if (value.trim().length < 3) return "Representative name must be at least 3 characters.";
        if (!namePattern.test(value.trim())) {
            return "Representative name can only contain letters, spaces, dots (.), and dashes (-).";
        }
        return "";
    };

    const validateContactNumber = (value) => {
        if (!value.trim()) return "Contact number is required.";
        if (!phonePattern.test(value.trim())) {
            return "Contact number can only contain numbers, +, spaces, and dash (-).";
        }
        if (value.trim().length < 6) {
            return "Contact number must be at least 6 characters.";
        }
        return "";
    };

    const validateEmail = (value) => {
        if (!value.trim()) return "Email is required.";
        if (!emailPattern.test(value.trim())) {
            return "Email must be valid (e.g., user@example.com).";
        }
        return "";
    };

    const validateCity = (value) => {
        if (!value) return "City must be selected.";
        return "";
    };

    const validateBlock = (value) => {
        if (!value.trim()) return "Block is required.";
        if (!blockPattern.test(value.trim())) {
            return "Block must contain numbers only.";
        }
        return "";
    };

    const validateRoad = (value) => {
        if (!value.trim()) return "Road is required.";
        if (!roadPattern.test(value.trim())) {
            return "Road cannot contain special characters like @, #, $, *, etc.";
        }
        return "";
    };

    const validateBuilding = (value) => {
        if (!value.trim()) return "Building is required.";
        if (!buildingPattern.test(value.trim())) {
            return "Building must contain numbers only.";
        }
        return "";
    };

    // =================== CHANGE HANDLERS WITH LIVE VALIDATION ===================
    const handleSupplierNameChange = (e) => {
        const value = e.target.value;

        // Block invalid input immediately
        if (value && !namePattern.test(value)) {
            setErrors(prev => ({ ...prev, supplierName: "Only letters, spaces, dots (.), and dashes (-) allowed." }));
            return;
        }

        setSupplierName(value);
        setTouched(prev => ({ ...prev, supplierName: true }));

        const error = validateSupplierName(value);
        setErrors(prev => ({ ...prev, supplierName: error }));
    };

    const handleRepNameChange = (e) => {
        const value = e.target.value;

        // Block invalid input immediately
        if (value && !namePattern.test(value)) {
            setErrors(prev => ({ ...prev, repName: "Only letters, spaces, dots (.), and dashes (-) allowed." }));
            return;
        }

        setRepName(value);
        setTouched(prev => ({ ...prev, repName: true }));

        const error = validateRepName(value);
        setErrors(prev => ({ ...prev, repName: error }));
    };

    const handleContactNumberChange = (e) => {
        const value = e.target.value;

        // Block invalid input
        if (value && !phonePattern.test(value)) {
            setErrors(prev => ({ ...prev, contactNumber: "Only numbers, +, spaces, and - allowed." }));
            return;
        }

        setContactNumber(value);
        setTouched(prev => ({ ...prev, contactNumber: true }));

        const error = validateContactNumber(value);
        setErrors(prev => ({ ...prev, contactNumber: error }));
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        setTouched(prev => ({ ...prev, email: true }));

        const error = validateEmail(value);
        setErrors(prev => ({ ...prev, email: error }));
    };

    const handleBlockChange = (e) => {
        const value = e.target.value;

        // Block non-numeric input
        if (value && !blockPattern.test(value)) {
            setErrors(prev => ({ ...prev, block: "Only numbers allowed." }));
            return;
        }

        setBlock(value);
        setTouched(prev => ({ ...prev, block: true }));

        const error = validateBlock(value);
        setErrors(prev => ({ ...prev, block: error }));
    };

    const handleRoadChange = (e) => {
        const value = e.target.value;

        // Block invalid characters
        if (value && !roadPattern.test(value)) {
            setErrors(prev => ({ ...prev, road: "Invalid characters detected." }));
            return;
        }

        setRoad(value);
        setTouched(prev => ({ ...prev, road: true }));

        const error = validateRoad(value);
        setErrors(prev => ({ ...prev, road: error }));
    };

    const handleBuildingChange = (e) => {
        const value = e.target.value;

        // Block non-numeric input
        if (value && !buildingPattern.test(value)) {
            setErrors(prev => ({ ...prev, building: "Only numbers allowed." }));
            return;
        }

        setBuilding(value);
        setTouched(prev => ({ ...prev, building: true }));

        const error = validateBuilding(value);
        setErrors(prev => ({ ...prev, building: error }));
    };

    // =================== CITY DROPDOWN HANDLERS ===================
    const filteredCities = cityQuery
        ? cityOptions.filter(c =>
            c.cityName.toLowerCase().includes(cityQuery.toLowerCase())
        )
        : cityOptions;

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);
        setShowCityDropdown(true);
        setCityHighlightIndex(0);
        setTouched(prev => ({ ...prev, city: true }));
    };

    const handleSelectCity = (cityOption) => {
        setCity(cityOption.cityName);
        setCityQuery(cityOption.cityName);
        setShowCityDropdown(false);
        setCityHighlightIndex(0);
        setTouched(prev => ({ ...prev, city: true }));

        const error = validateCity(cityOption.cityName);
        setErrors(prev => ({ ...prev, city: error }));
    };

    const handleCityInputFocus = () => {
        setShowCityDropdown(true);
        setCityHighlightIndex(0);
    };

    const handleCityKeyDown = (e) => {
        if (!showCityDropdown) return;
        const list = filteredCities || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setCityHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCityHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[cityHighlightIndex];
            if (picked) handleSelectCity(picked);
        } else if (e.key === "Escape") {
            setShowCityDropdown(false);
        }
    };

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({
            supplierName: true,
            repName: true,
            contactNumber: true,
            email: true,
            city: true,
            block: true,
            road: true,
            building: true
        });

        // Validate all fields
        const validationErrors = {
            supplierName: validateSupplierName(supplierName),
            repName: validateRepName(repName),
            contactNumber: validateContactNumber(contactNumber),
            email: validateEmail(email),
            city: validateCity(city),
            block: validateBlock(block),
            road: validateRoad(road),
            building: validateBuilding(building)
        };

        setErrors(validationErrors);

        // Check if any errors exist
        const hasErrors = Object.values(validationErrors).some(error => error !== "");

        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }
    
        const payload = {
            supplierName: supplierName.trim(),
            representative: repName.trim(),
            contact: contactNumber.trim(),
            email: email.trim(),
            city: city,
            block: block.trim(),
            road: road.trim(),
            building: building.trim()
        };

        try {
            const response = await fetch(`/api/Suppliers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Supplier added successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/suppliers"), 1500);
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || "Failed to add supplier.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error adding supplier:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    return (
        <div className="add-supplier-page">
            {/* PAGE HEADER */}
            <FormHeader title="Add New Supplier Record" to="/suppliers" />

            {/* SUCCESS + ERROR */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setErrorMessage("")}></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Enter New Supplier Details:">
                <form className="add-supplier-form" onSubmit={handleSubmit}>

                    {/* SUPPLIER NAME */}
                    <input
                        type="text"
                        className={`form-control form-text-input ${touched.supplierName && errors.supplierName ? "is-invalid" : ""}`}
                        placeholder="Supplier Name"
                        value={supplierName}
                        onChange={handleSupplierNameChange}
                    />
                    {touched.supplierName && errors.supplierName && (
                        <div className="invalid-feedback d-block">{errors.supplierName}</div>
                    )}

                    {/* REPRESENTATIVE NAME */}
                    <input
                        type="text"
                        className={`form-control form-text-input ${touched.repName && errors.repName ? "is-invalid" : ""}`}
                        placeholder="Representative Name"
                        value={repName}
                        onChange={handleRepNameChange}
                    />
                    {touched.repName && errors.repName && (
                        <div className="invalid-feedback d-block">{errors.repName}</div>
                    )}

                    {/* CONTACT NUMBER */}
                    <input
                        type="text"
                        className={`form-control form-text-input ${touched.contactNumber && errors.contactNumber ? "is-invalid" : ""}`}
                        placeholder="Contact Number"
                        value={contactNumber}
                        onChange={handleContactNumberChange}
                    />
                    {touched.contactNumber && errors.contactNumber && (
                        <div className="invalid-feedback d-block">{errors.contactNumber}</div>
                    )}

                    {/* EMAIL */}
                    <input
                        type="email"
                        className={`form-control form-text-input ${touched.email && errors.email ? "is-invalid" : ""}`}
                        placeholder="Email"
                        value={email}
                        onChange={handleEmailChange}
                    />
                    {touched.email && errors.email && (
                        <div className="invalid-feedback d-block">{errors.email}</div>
                    )}

                    {/* CITY + BLOCK ROW */}
                    <div className="address-row">
                        <div className="address-column add-supplier-city" ref={cityRef}>
                            <input
                                type="text"
                                className={`form-control address-input ${touched.city && errors.city ? "is-invalid" : ""}`}
                                placeholder={loadingCities ? "Loading cities..." : "Search or select city"}
                                value={cityQuery}
                                onChange={handleCityInputChange}
                                onFocus={handleCityInputFocus}
                                onKeyDown={handleCityKeyDown}
                                disabled={loadingCities}
                                autoComplete="off"
                            />

                            {showCityDropdown && filteredCities.length > 0 && (
                                <ul className="list-group city-dropdown">
                                    {filteredCities.map((c, idx) => (
                                        <li
                                            key={c.value}
                                            className={`list-group-item list-group-item-action ${idx === cityHighlightIndex ? "active" : ""}`}
                                            onMouseDown={(ev) => { ev.preventDefault(); }}
                                            onClick={() => handleSelectCity(c)}
                                            onMouseEnter={() => setCityHighlightIndex(idx)}
                                        >
                                            {c.cityName}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {touched.city && errors.city && (
                                <div className="invalid-feedback d-block">{errors.city}</div>
                            )}
                        </div>

                        <div className="address-column">
                            <input
                                type="text"
                                className={`form-control address-input ${touched.block && errors.block ? "is-invalid" : ""}`}
                                placeholder="Block"
                                value={block}
                                onChange={handleBlockChange}
                            />
                            {touched.block && errors.block && (
                                <div className="invalid-feedback d-block">{errors.block}</div>
                            )}
                        </div>
                    </div>

                    {/* ROAD + BUILDING ROW */}
                    <div className="address-row">
                        <div className="address-column">
                            <input
                                type="text"
                                className={`form-control address-input ${touched.road && errors.road ? "is-invalid" : ""}`}
                                placeholder="Road"
                                value={road}
                                onChange={handleRoadChange}
                            />
                            {touched.road && errors.road && (
                                <div className="invalid-feedback d-block">{errors.road}</div>
                            )}
                        </div>

                        <div className="address-column">
                            <input
                                type="text"
                                className={`form-control address-input ${touched.building && errors.building ? "is-invalid" : ""}`}
                                placeholder="Building"
                                value={building}
                                onChange={handleBuildingChange}
                            />
                            {touched.building && errors.building && (
                                <div className="invalid-feedback d-block">{errors.building}</div>
                            )}
                        </div>
                    </div>

                    {/* BUTTON */}
                    <AddButton text="Add New Supplier" />

                </form>
            </FormWrapper>
        </div>
    );
}
