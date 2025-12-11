import "./Login.css";
import background from "../../assets/Background.png";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";

export default function Register() {
    const navigate = useNavigate();

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

    const [errors, setErrors] = useState([]);
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // ---- CITY DROPDOWN STATE (like employee page) -----------------
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

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

                // If form already has a city (unlikely on register), sync query
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

    // Generic change handler for normal inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
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

        // Also update form.city (backend uses City NAME)
        setForm((prev) => ({
            ...prev,
            city: val,
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
        setErrors([]);

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
                    // backend expects City as NAME string
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

                setErrors(apiErrors);
                return;
            }

            // success -> go to login
            navigate("/login");
        } catch (err) {
            console.error("REGISTER ERROR:", err);
            setErrors(["Registration failed. Please try again."]);
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
                    {errors.length > 0 && (
                        <div className="alert alert-danger py-2">
                            <ul className="mb-0">
                                {errors.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Name row */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">First Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your first name"
                                    name="firstName"
                                    value={form.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">Last Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your last name"
                                    name="lastName"
                                    value={form.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="Enter your email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">Phone Number</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter your phone number"
                                    name="phoneNumber"
                                    value={form.phoneNumber}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password & Confirm */}
                        <div className="row mb-5">
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Enter your password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold login-label">
                                    Confirm Password
                                </label>
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Confirm your password"
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                />
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

                        {/* CITY (searchable like employee) */}
                        <div className="row mb-3">
                            <div className="col-md-6" ref={cityRef} style={{ position: "relative" }}>
                                <label className="form-label fw-bold">City</label>
                                <input
                                    name="city"
                                    type="text"
                                    className="form-control"
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
                                            {/* Optional: "Select city" header item */}
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
                            </div>

                            {/* BLOCK */}
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Block</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter block"
                                    name="block"
                                    value={form.block}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* ROAD & BUILDING */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Road / Street</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter road / street"
                                    name="road"
                                    value={form.road}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Building / Floor</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter building / floor"
                                    name="buildingFloor"
                                    value={form.buildingFloor}
                                    onChange={handleChange}
                                />
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
