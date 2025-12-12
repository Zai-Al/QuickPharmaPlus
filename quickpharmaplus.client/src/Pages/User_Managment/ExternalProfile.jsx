// src/Pages/User_Management/ExternalProfile.jsx
import { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../External_System/Shared_Components/PageHeader";
import DialogModal from "../External_System/Shared_Components/DialogModal";
import SuccessAlert from "../External_System/Shared_Components/SuccessAlert";
import { AuthContext } from "../../Context/AuthContext";
import "./ExternalProfile.css";

export default function ExternalProfile() {
    const { logout, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [mode, setMode] = useState("view"); // "view" | "edit"

    const [profileData, setProfileData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        block: "",
        road: "",
        buildingFloor: "",
    });

    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const disabled = mode === "view";

    const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

    // ---- CITY DROPDOWN STATE (same idea as Register) -----------------
    const [cities, setCities] = useState([]);
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

    // ---- FIELD-LEVEL ERRORS -----------------------------------------
    const [errors, setErrors] = useState({});

    // ---- SUCCESS ALERT ----------------------------------------------
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    // Auto-hide success message after 3 seconds
    useEffect(() => {
        if (showSuccess) {
            const timer = setTimeout(() => {
                setShowSuccess(false);
            }, 3000); // 3 seconds

            return () => clearTimeout(timer);
        }
    }, [showSuccess]);


    // ---- DELETE MODAL -----------------------------------------------
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isEmpty = (val) => !val || val.trim() === "";
    const nameRegex = /^[A-Za-z]{3,}$/; // at least 3 letters, only letters
    const phoneRegex = /^[0-9]{8}$/;    // exactly 8 digits
    const numericRegex = /^[0-9]+$/;    // numbers only

    // -------- VALIDATION (similar to Register) -----------------------
    const validateProfile = (data) => {
        const newErrors = {};

        const {
            firstName,
            lastName,
            phone,
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

        // Phone
        if (isEmpty(phone)) {
            newErrors.phone = "Phone number is required.";
        } else if (!phoneRegex.test(phone.trim())) {
            newErrors.phone =
                "Phone number must be 8 digits and contain numbers only.";
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

    // 1) Fetch profile from backend on mount
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setLoadError("");

                const res = await fetch(
                    `${baseURL.replace(/\/$/, "")}/api/ExternalProfile`,
                    {
                        method: "GET",
                        credentials: "include", // send auth cookie
                    }
                );

                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        setLoadError("You must be logged in to view your profile.");
                    } else {
                        setLoadError("Failed to load profile information.");
                    }
                    setLoading(false);
                    return;
                }

                const data = await res.json();

                const cityName = data.city || "";

                setProfileData({
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    email: data.email || "",
                    phone: data.phoneNumber || data.phone || "",
                    city: cityName,
                    block: data.block || "",
                    road: data.road || "",
                    buildingFloor: data.buildingFloor || "",
                });

                setCityQuery(cityName); // keep input in sync
                setLoading(false);
            } catch (err) {
                console.error("PROFILE LOAD ERROR:", err);
                setLoadError("An error occurred while loading your profile.");
                setLoading(false);
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2) Fetch cities (like in Register)
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await fetch(
                    `${baseURL.replace(/\/$/, "")}/api/cities`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                if (!res.ok) throw new Error("Failed to load cities");

                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setCities(list);

                // If profile already has a city, keep it as query
                if (profileData.city) {
                    setCityQuery(profileData.city);
                }
            } catch (err) {
                console.error("CITIES LOAD ERROR:", err);
                setCities([]);
            }
        };

        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 3) Close dropdown when clicking outside
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

    // Generic change handler (clear errors as user types)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));

        setErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    // City filtering (search)
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
        setProfileData((prev) => ({ ...prev, city: val }));

        setErrors((prev) => ({
            ...prev,
            city: undefined,
        }));

        if (!disabled) {
            setShowCityDropdown(true);
            setHighlightIndex(0);
        }
    };

    const handleSelectCity = (city) => {
        const name = city.cityName ?? city.CityName ?? "";
        setCityQuery(name);
        setProfileData((prev) => ({ ...prev, city: name }));
        setShowCityDropdown(false);
        setHighlightIndex(0);

        setErrors((prev) => ({
            ...prev,
            city: undefined,
        }));
    };

    const handleCityInputFocus = () => {
        if (!disabled) {
            setShowCityDropdown(true);
            setHighlightIndex(0);
        }
    };

    const handleCityKeyDown = (e) => {
        if (!showCityDropdown || disabled) return;
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

    // Save (PUT to backend)
    const handleSave = async () => {
        // front-end validation first
        const newErrors = validateProfile(profileData);
        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        try {
            const res = await fetch(
                `${baseURL.replace(/\/$/, "")}/api/externalprofile`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        firstName: profileData.firstName,
                        lastName: profileData.lastName,
                        email: profileData.email,
                        phoneNumber: profileData.phone,
                        city: profileData.city,
                        block: profileData.block,
                        road: profileData.road,
                        buildingFloor: profileData.buildingFloor,
                    }),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                console.error("UPDATE ERROR:", data);
                // Optional: attach any returned error to a field, e.g. phone
                if (data && data.message) {
                    setErrors((prev) => ({
                        ...prev,
                        phone: data.message,
                    }));
                }
                return;
            }

            setMode("view");
            setShowSuccess(true);
            setSuccessMessage("Your profile has been updated successfully.");
        } catch (err) {
            console.error("UPDATE ERROR:", err);
        }
    };

    const handleLogout = () => {
        logout();
    };

    const handleEdit = () => {
        setErrors({});
        setMode("edit");
        setShowSuccess(false);
    };

    const handleCancel = () => {
        // clear errors when canceling edit
        setErrors({});
        setMode("view");
    };

    // Delete (open modal)
    const handleDelete = () => {
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const res = await fetch(
                `${baseURL.replace(/\/$/, "")}/api/ExternalProfile`,
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );

            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.error("DELETE ERROR:", text);
                // You can show an error using SuccessAlert styled differently or another component
                setShowDeleteModal(false);
                alert("Failed to delete your account. Please try again.");
                return;
            }

            setShowDeleteModal(false);
            logout();
            window.location.href = "/";
        } catch (err) {
            console.error("DELETE ERROR:", err);
            setShowDeleteModal(false);
            alert("An unexpected error occurred while deleting the account.");
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
    };

    const handleResetPassword = () => {
        navigate("/resetPassword");
    };

    return (
        <>
            <PageHeader title="Profile" />

            <div className="container my-5">
                {/* Welcome + Logout only */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold m-0">
                        Welcome {profileData.firstName || user?.firstName || "User"}!
                    </h2>

                    {user && (
                        <button
                            className="btn btn-secondary px-4 py-2 fs-6"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    )}
                </div>

                {/* Loading / error states */}
                {loading && <p>Loading profile...</p>}
                {loadError && !loading && (
                    <div className="alert alert-danger">{loadError}</div>
                )}

                {!loading && !loadError && (
                    <>
                        {/* Success alert when profile updated */}
                        <SuccessAlert
                            show={showSuccess}
                            message={successMessage}
                            onClose={() => setShowSuccess(false)}
                        />

                        <div className="card shadow-sm profile-card mt-3">
                            <div className="card-body py-4 px-5">
                                <h4 className="fw-bold mb-4">Profile Details</h4>

                                {/* First & Last Name Row */}
                                <div className="row mb-3 profile-row">
                                    <div className="col-md-6 text-start">
                                        <label className="fw-bold">First Name:</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            className={`form-control profile-input ${errors.firstName ? "is-invalid" : ""
                                                }`}
                                            value={profileData.firstName}
                                            onChange={handleChange}
                                            disabled={disabled}
                                        />
                                        {errors.firstName && (
                                            <div className="invalid-feedback d-block">
                                                {errors.firstName}
                                            </div>
                                        )}
                                    </div>

                                    <div className="col-md-6 text-start">
                                        <label className="fw-bold">Last Name:</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            className={`form-control profile-input ${errors.lastName ? "is-invalid" : ""
                                                }`}
                                            value={profileData.lastName}
                                            onChange={handleChange}
                                            disabled={disabled}
                                        />
                                        {errors.lastName && (
                                            <div className="invalid-feedback d-block">
                                                {errors.lastName}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email & Phone Row */}
                                <div className="row mb-4 profile-row">
                                    <div className="col-md-6 text-start">
                                        <label className="fw-bold">Email:</label>
                                        <input
                                            type="email"
                                            name="email"
                                            className="form-control profile-input"
                                            value={profileData.email}
                                            onChange={handleChange}
                                            disabled
                                        />
                                    </div>

                                    <div className="col-md-6 text-start">
                                        <label className="fw-bold">Phone:</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            className={`form-control profile-input ${errors.phone ? "is-invalid" : ""
                                                }`}
                                            value={profileData.phone}
                                            onChange={handleChange}
                                            disabled={disabled}
                                        />
                                        {errors.phone && (
                                            <div className="invalid-feedback d-block">
                                                {errors.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address section – like Sign Up */}
                                <h5 className="fw-bold mb-3">Address</h5>

                                <div
                                    className="row mb-3"
                                    ref={cityRef}
                                    style={{ position: "relative" }}
                                >
                                    <div className="col-md-6 text-start">
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
                                            disabled={disabled || cities.length === 0}
                                            autoComplete="off"
                                        />

                                        {showCityDropdown &&
                                            !disabled &&
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
                                                            className={`list-group-item list-group-item-action ${idx === highlightIndex
                                                                    ? "active"
                                                                    : ""
                                                                }`}
                                                            onMouseDown={(ev) =>
                                                                ev.preventDefault()
                                                            }
                                                            onClick={() =>
                                                                handleSelectCity(c)
                                                            }
                                                            onMouseEnter={() =>
                                                                setHighlightIndex(idx)
                                                            }
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

                                    <div className="col-md-6 text-start">
                                        <label className="form-label fw-bold">Block</label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.block ? "is-invalid" : ""
                                                }`}
                                            placeholder="Enter block"
                                            name="block"
                                            value={profileData.block}
                                            onChange={handleChange}
                                            disabled={disabled}
                                        />
                                        {errors.block && (
                                            <div className="invalid-feedback d-block">
                                                {errors.block}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6 text-start">
                                        <label className="form-label fw-bold">
                                            Road / Street
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.road ? "is-invalid" : ""
                                                }`}
                                            placeholder="Enter road / street"
                                            name="road"
                                            value={profileData.road}
                                            onChange={handleChange}
                                            disabled={disabled}
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
                                            value={profileData.buildingFloor}
                                            onChange={handleChange}
                                            disabled={disabled}
                                        />
                                        {errors.buildingFloor && (
                                            <div className="invalid-feedback d-block">
                                                {errors.buildingFloor}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom-right buttons INSIDE card */}
                                <div className="mt-4 d-flex justify-content-end gap-3">
                                    {mode === "view" ? (
                                        <>
                                            <button
                                                className="btn btn-info text-white px-4 py-2 fs-6"
                                                onClick={handleEdit}
                                            >
                                                Edit Profile
                                            </button>

                                            <button
                                                className="btn btn-danger px-4 py-2 fs-6"
                                                onClick={handleDelete}
                                            >
                                                Delete Profile
                                            </button>

                                            <button
                                                className="btn btn-outline-secondary px-4 py-2 fs-6"
                                                onClick={handleResetPassword}
                                            >
                                                Reset Password
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                className="btn btn-danger px-4 py-2 fs-6"
                                                onClick={handleCancel}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                className="btn btn-info text-white px-4 py-2 fs-6"
                                                onClick={handleSave}
                                            >
                                                Save Changes
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Delete confirmation modal */}
                        <DialogModal
                            show={showDeleteModal}
                            title="Delete Account"
                            body="Are you sure you want to delete your account? This action cannot be undone."
                            confirmLabel="Delete"
                            cancelLabel="Cancel"
                            onConfirm={confirmDelete}
                            onCancel={cancelDelete}
                        />
                    </>
                )}
            </div>
        </>
    );
}
