import "./Login.css";
import background from "../../assets/Background.png";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Register() {
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    // field-level errors like PrescriptionTab
    const [errors, setErrors] = useState({});
    // server-side API errors (identity, etc.) as a list at top
    const [serverErrors, setServerErrors] = useState([]);

    // ---- CITY DROPDOWN STATE -----------------
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

    const isEmpty = (val) => !val || val.trim() === "";

    const nameRegex = /^[A-Za-z]{3,}$/; // at least 3 letters, letters only
    const phoneRegex = /^[0-9]{8}$/;    // exactly 8 digits
    const numericRegex = /^[0-9]+$/;    // only digits
    const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.\-_,])[A-Za-z\d@$!%*?&.\-_,]{8,}$/;

    // --------- VALIDATION -------------------------
    const validateForm = (data) => {
        const newErrors = {};

        const {
            firstName,
            lastName,
            email,
            phoneNumber,
            password,
            confirmPassword,
            city,
            block,
            road,
            buildingFloor,
        } = data;

        // First name
        if (isEmpty(firstName)) {
            newErrors.firstName = "First name is required.";
        } else if (!nameRegex.test(firstName.trim())) {
            newErrors.firstName =
                "First name must be at least 3 letters and contain letters only.";
        }

        // Last name
        if (isEmpty(lastName)) {
            newErrors.lastName = "Last name is required.";
        } else if (!nameRegex.test(lastName.trim())) {
            newErrors.lastName =
                "Last name must be at least 3 letters and contain letters only.";
        }

        // Email
        if (isEmpty(email)) {
            newErrors.email = "Email is required.";
        } else if (!email.includes("@")) {
            newErrors.email = "Email must contain '@'.";
        }

        // Phone
        if (isEmpty(phoneNumber)) {
            newErrors.phoneNumber = "Phone number is required.";
        } else if (!phoneRegex.test(phoneNumber.trim())) {
            newErrors.phoneNumber =
                "Phone number must be 8 digits and contain numbers only.";
        }

        // Password
        if (isEmpty(password)) {
            newErrors.password = "Password is required.";
        } else if (!strongPasswordRegex.test(password)) {
            newErrors.password =
                "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }

        // Confirm Password
        if (isEmpty(confirmPassword)) {
            newErrors.confirmPassword = "Confirm password is required.";
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = "Password and Confirm Password do not match.";
        }

        // Address: optional but all-or-nothing
        const hasAnyAddress =
            !isEmpty(city) ||
            !isEmpty(block) ||
            !isEmpty(road) ||
            !isEmpty(buildingFloor);

        if (hasAnyAddress) {
            if (isEmpty(city)) {
                newErrors.city = "City is required when adding an address.";
            }
            if (isEmpty(block)) {
                newErrors.block = "Block is required when adding an address.";
            }
            if (isEmpty(road)) {
                newErrors.road = "Road / Street is required when adding an address.";
            }
            if (isEmpty(buildingFloor)) {
                newErrors.buildingFloor =
                    "Building / floor is required when adding an address.";
            }
        }

        // Block numeric only (if not empty)
        if (!isEmpty(block) && !numericRegex.test(block.trim())) {
            newErrors.block = "Block must contain numbers only.";
        }

        // Road numeric only (if not empty)
        if (!isEmpty(road) && !numericRegex.test(road.trim())) {
            newErrors.road = "Road / Street must contain numbers only.";
        }

        return newErrors;
    };

    // Fetch cities on mount
    useEffect(() => {
        const fetchCities = async () => {
            try {
                if (!baseURL) return;

                const response = await fetch(`${baseURL}/api/cities`, {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    throw new Error("Failed to load cities");
                }

                const data = await response.json();
                const list = Array.isArray(data) ? data : [];
                setCities(list);

                if (form.city) {
                    setCityQuery(form.city);
                }
            } catch (err) {
                console.error("CITIES LOAD ERROR:", err);
                setCities([]);
            }
        };

        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [baseURL]);

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

    // Generic change handler
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Clear field error as user types (optional but nicer)
        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    // Filter cities based on query (case-insensitive)
    const filteredCities =
        cityQuery && cityQuery.trim().length > 0
            ? (cities || []).filter((c) =>
                String(c.cityName ?? c.CityName ?? "")
                    .toLowerCase()
                    .includes(cityQuery.toLowerCase())
            )
            : cities || [];

    // City input change (searchable)
    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);
        setShowCityDropdown(true);
        setHighlightIndex(0);

        setForm((prev) => ({
            ...prev,
            city: val,
        }));

        setErrors((prev) => ({
            ...prev,
            city: undefined,
        }));
    };

    const handleSelectCity = (city) => {
        const name = city.cityName ?? city.CityName ?? "";
        setCityQuery(name);
        setForm((prev) => ({
            ...prev,
            city: name,
        }));
        setShowCityDropdown(false);
        setHighlightIndex(0);

        setErrors((prev) => ({
            ...prev,
            city: undefined,
        }));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerErrors([]);

        const newErrors = validateForm(form);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {
            const response = await fetch(`${baseURL}/api/account/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    confirmPassword: form.confirmPassword,
                    firstName: form.firstName,
                    lastName: form.lastName,
                    phoneNumber: form.phoneNumber,
                    city: form.city || null,
                    block: form.block || null,
                    road: form.road || null,
                    buildingFloor: form.buildingFloor || null,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));

                let apiErrors = [];

                if (Array.isArray(data.errors)) {
                    apiErrors = data.errors.map((e) =>
                        typeof e === "string" ? e : e.description
                    );
                } else if (data.message) {
                    apiErrors = [data.message];
                } else {
                    apiErrors = ["Registration failed. Please check your details."];
                }

                setServerErrors(apiErrors);
                return;
            }

            navigate("/login");
        } catch (err) {
            console.error("REGISTER ERROR:", err);
            setServerErrors(["Registration failed. Please try again."]);
        }
    };

    return (
        <div className="login-wrapper d-flex">
            {/* Left background image section */}
            <div
                className="login-left"
                style={{
                    backgroundImage: `url(${background})`,
                    backgroundSize: "605px",
                    backgroundPosition: "left center",
                }}
            ></div>

            <div className="login-right d-flex flex-column justify-content-center align-items-center">
                <h2 className="fw-bold mb-2 text-center">Welcome to QuickPharma+</h2>
                <p className="text-muted mb-5 text-center">
                    Create an account by entering the following information:
                </p>

                <div className="login-box" style={{ width: "100%", maxWidth: "650px" }}>
                    {serverErrors.length > 0 && (
                        <div className="alert alert-danger py-2">
                            <ul className="mb-0">
                                {serverErrors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name row */}
                        <div className="row mb-4">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.firstName ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter your first name"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                />
                                {errors.firstName && (
                                    <div className="invalid-feedback d-block">
                                        {errors.firstName}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.lastName ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter your last name"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                />
                                {errors.lastName && (
                                    <div className="invalid-feedback d-block">
                                        {errors.lastName}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="row mb-4">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter your email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                                {errors.email && (
                                    <div className="invalid-feedback d-block">
                                        {errors.email}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.phoneNumber ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter your phone number"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                />
                                {errors.phoneNumber && (
                                    <div className="invalid-feedback d-block">
                                        {errors.phoneNumber}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Password & Confirm */}
                        <div className="row mb-5">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.password ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter your password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                                <div
                                    className="form-text text-muted mt-1"
                                    style={{ fontSize: "0.85rem" }}
                                >
                                    Must be at least 8 characters and include uppercase,
                                    lowercase, number, and special character.
                                </div>
                                {errors.password && (
                                    <div className="invalid-feedback d-block">
                                        {errors.password}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold login-label">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    className={`form-control ${errors.confirmPassword ? "is-invalid" : ""
                                        }`}
                                    placeholder="Confirm your password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                />
                                {errors.confirmPassword && (
                                    <div className="invalid-feedback d-block">
                                        {errors.confirmPassword}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="my-4" />

                        {/* Address */}
                        <div className="d-flex align-items-center mb-2">
                            <h5 className="fw-bold me-2 mb-0">Address</h5>
                            <span className="text-muted" style={{ fontSize: "0.9rem" }}>
                                (optional for shipping delivery)
                            </span>
                        </div>

                        {/* CITY & BLOCK */}
                        <div className="row mb-3">
                            <div
                                className="col-md-6 text-start"
                                ref={cityRef}
                                style={{ position: "relative" }}
                            >
                                <label className="form-label fw-bold">City</label>
                                <input
                                    name="city"
                                    type="text"
                                    className={`form-control ${errors.city ? "is-invalid" : ""
                                        }`}
                                    placeholder={
                                        cities.length === 0
                                            ? "Loading cities..."
                                            : "Select city or start typing"
                                    }
                                    value={cityQuery}
                                    onChange={handleCityInputChange}
                                    onFocus={handleCityInputFocus}
                                    onKeyDown={handleCityKeyDown}
                                    disabled={cities.length === 0}
                                    autoComplete="off"
                                />

                                {showCityDropdown &&
                                    (filteredCities || []).length > 0 && (
                                        <ul
                                            className="list-group position-absolute w-100"
                                            style={{
                                                zIndex: 1500,
                                                maxHeight: 200,
                                                overflowY: "auto",
                                            }}
                                        >
                                            <li className="list-group-item disabled">
                                                Select city
                                            </li>

                                            {filteredCities.map((c, idx) => (
                                                <li
                                                    key={c.cityId}
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

                                {errors.city && (
                                    <div className="invalid-feedback d-block">
                                        {errors.city}
                                    </div>
                                )}
                            </div>

                            {/* BLOCK */}
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Block</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.block ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter block"
                                    name="block"
                                    value={form.block}
                                    onChange={handleChange}
                                />
                                {errors.block && (
                                    <div className="invalid-feedback d-block">
                                        {errors.block}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ROAD & BUILDING */}
                        <div className="row mb-3">
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">Road / Street</label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.road ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter road / street"
                                    name="road"
                                    value={form.road}
                                    onChange={handleChange}
                                />
                                {errors.road && (
                                    <div className="invalid-feedback d-block">
                                        {errors.road}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6 text-start">
                                <label className="form-label fw-bold">
                                    Building / Floor
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.buildingFloor ? "is-invalid" : ""
                                        }`}
                                    placeholder="Enter building / floor"
                                    name="buildingFloor"
                                    value={form.buildingFloor}
                                    onChange={handleChange}
                                />
                                {errors.buildingFloor && (
                                    <div className="invalid-feedback d-block">
                                        {errors.buildingFloor}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 mt-5 login-btn"
                            style={{ padding: "12px", fontSize: "1.1rem" }}
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="text-center mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="login-link">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
