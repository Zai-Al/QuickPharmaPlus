import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useRef } from "react";
import { AuthContext } from "../../Context/AuthContext.jsx";
import "./Edit_Profile_Internal.css";

export default function EditProfile_Internal() {
    const navigate = useNavigate();
    const { user: ctxUser, setUser } = useContext(AuthContext);

    // local editable state
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        contactNumber: "",
        addressId: null,
        cityId: "",
        block: "",
        street: "",
        buildingNumber: ""
    });

    const [cities, setCities] = useState([]);
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [saving, setSaving] = useState(false);

    // search / dropdown state for searchable city control
    const [cityQuery, setCityQuery] = useState("");
    const [showCityDropdown, setShowCityDropdown] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const cityRef = useRef(null);

    // load initial data (from context)
    useEffect(() => {
        const user = ctxUser ?? {};
        const addr = user?.address ?? user?.Address ?? {};

        const initialCityId =
            addr?.cityId ??
            addr?.CityId ??
            addr?.city?.cityId ??
            addr?.city?.CityId ??
            "";

        setForm({
            firstName: user?.firstName ?? user?.FirstName ?? "",
            lastName: user?.lastName ?? user?.LastName ?? "",
            contactNumber: user?.contactNumber ?? user?.ContactNumber ?? user?.contactNumber ?? "",
            addressId: user?.addressId ?? user?.AddressId ?? addr?.addressId ?? addr?.AddressId ?? null,
            // normalize city id to string for the select control
            cityId: initialCityId ? String(initialCityId) : "",
            block: addr?.block ?? addr?.Block ?? "",
            street: addr?.street ?? addr?.Street ?? "",
            buildingNumber: addr?.buildingNumber ?? addr?.BuildingNumber ?? addr?.buildingFloor ?? ""
        });
    }, [ctxUser]);

    // keep cityQuery in sync when cities or form.cityId change
    useEffect(() => {
        if (!cities || cities.length === 0) return;
        if (form.cityId) {
            const sel = cities.find(c => String(c.cityId) === String(form.cityId));
            setCityQuery(sel ? (sel.cityName ?? sel.CityName ?? "") : "");
        } else {
            // try to infer by ctxUser city name if present (existing behavior)
            const addr = ctxUser?.address ?? ctxUser?.Address ?? {};
            const cityName =
                addr?.city?.cityName ??
                addr?.city?.CityName ??
                addr?.city ??
                ctxUser?.city ??
                ctxUser?.City?.cityName ??
                ctxUser?.City?.CityName ??
                "";
            setCityQuery(cityName ?? "");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cities, form.cityId]);

    useEffect(() => {
        // fetch cities from repository endpoint
        const fetchCities = async () => {
            try {
                const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
                const url = `${baseURL.replace(/\/$/, "")}/api/cities`;
                const res = await fetch(url, { credentials: "include" });
                if (!res.ok) throw new Error("Failed to load cities");
                const data = await res.json();
                setCities(Array.isArray(data) ? data : []);

                // If user did not have a cityId but has a city name, map it to id
                const currentCityId = form.cityId;
                if ((!currentCityId || currentCityId === "") && ctxUser) {
                    const addr = ctxUser?.address ?? ctxUser?.Address ?? {};
                    const cityName =
                        addr?.city?.cityName ??
                        addr?.city?.CityName ??
                        addr?.city ??
                        ctxUser?.city ??
                        ctxUser?.City?.cityName ??
                        ctxUser?.City?.CityName ??
                        "";

                    if (cityName) {
                        const found = (Array.isArray(data) ? data : []).find(c =>
                            String(c.cityName ?? c.CityName ?? "").trim().toLowerCase() === String(cityName).trim().toLowerCase()
                        );
                        if (found) {
                            setForm(prev => ({ ...prev, cityId: String(found.cityId) }));
                        }
                    }
                }
            } catch (err) {
                console.error("Cities load error:", err);
                setCities([]);
            }
        };

        fetchCities();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctxUser]); // refetch/map when user changes

    // close dropdown on outside click
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

    // live validation rules
    const validateField = (name, value) => {
        switch (name) {
            case "firstName":
            case "lastName":
                if (!value || value.trim().length === 0) return "This field is required.";
                return "";
            case "contactNumber":
                if (!value || value.trim().length === 0) return "Phone number is required.";
                if (!/^[\d+\s()-]{6,20}$/.test(value)) return "Invalid phone number.";
                return "";
            default:
                return "";
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
    };

    // city control handlers
    const filteredCities = (cityQuery ?? "")
        ? (cities || []).filter(c => (String(c.cityName ?? c.CityName ?? "").toLowerCase().includes(String(cityQuery).toLowerCase())))
        : cities;

    const handleCityInputChange = (e) => {
        const val = e.target.value;
        setCityQuery(val);
        setShowCityDropdown(true);
        setHighlightIndex(0);
    };

    const handleSelectCity = (city) => {
        setForm(prev => ({ ...prev, cityId: String(city.cityId) }));
        setCityQuery(city.cityName ?? city.CityName ?? "");
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
            setHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[highlightIndex];
            if (picked) handleSelectCity(picked);
        } else if (e.key === "Escape") {
            setShowCityDropdown(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setServerError("");
        const newErrors = {
            firstName: validateField("firstName", form.firstName),
            lastName: validateField("lastName", form.lastName),
            contactNumber: validateField("contactNumber", form.contactNumber)
        };

        setErrors(newErrors);

        if (Object.values(newErrors).some(Boolean)) return;

        setSaving(true);

        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL || window.location.origin;

            // 1) Update or create address
            let addressId = form.addressId;
            const cityIdNumber = form.cityId ? parseInt(form.cityId, 10) : null;

            if (addressId) {
                const addressPayload = {
                    addressId: addressId,
                    street: form.street,
                    block: form.block,
                    buildingNumber: form.buildingNumber,
                    cityId: cityIdNumber
                };

                const resAddr = await fetch(`${baseURL.replace(/\/$/, "")}/api/addresses/${addressId}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(addressPayload)
                });

                if (!resAddr.ok) {
                    const err = await resAddr.text();
                    throw new Error(err || "Failed to update address");
                }
            } else {
                const createPayload = {
                    street: form.street,
                    block: form.block,
                    buildingNumber: form.buildingNumber,
                    cityId: cityIdNumber
                };

                const resCreate = await fetch(`${baseURL.replace(/\/$/, "")}/api/addresses`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(createPayload)
                });

                if (!resCreate.ok) {
                    const err = await resCreate.text();
                    throw new Error(err || "Failed to create address");
                }

                const created = await resCreate.json();
                addressId = created.addressId ?? created.AddressId ?? created.id;
            }

            // 2) Update employee record
            const userId = ctxUser?.userId ?? ctxUser?.UserId ?? ctxUser?.userId ?? null;
            if (!userId) throw new Error("User ID missing");

            const userPayload = {
                userId: userId,
                firstName: form.firstName,
                lastName: form.lastName,
                contactNumber: form.contactNumber,
                addressId: addressId
            };

            const resUser = await fetch(`${baseURL.replace(/\/$/, "")}/api/employees/${userId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userPayload)
            });

            if (!resUser.ok) {
                const err = await resUser.text();
                throw new Error(err || "Failed to update user");
            }

            // 3) update local auth context and session storage
            const updatedUser = {
                ...ctxUser,
                firstName: form.firstName,
                lastName: form.lastName,
                contactNumber: form.contactNumber,
                addressId: addressId,
                address: {
                    addressId: addressId,
                    street: form.street,
                    block: form.block,
                    buildingNumber: form.buildingNumber,
                    cityId: cityIdNumber,
                    city: cities.find(c => String(c.cityId) === String(form.cityId))?.cityName ?? ""
                }
            };

            setUser(updatedUser);
            sessionStorage.setItem("user", JSON.stringify(updatedUser));

            navigate("/profileInternal", { state: { successMessage: "Profile updated successfully." } });
        } catch (err) {
            console.error("Save error:", err);
            setServerError(err?.message ?? "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="edit-profile-page">
            <div className="edit-header">
                <h1 className="edit-title">Edit User Profile</h1>

                <button
                    className="btn btn-warning cancel-btn"
                    onClick={() => navigate("/profileInternal")}
                >
                    <i className="bi bi-x-lg"></i> Cancel
                </button>
            </div>

            <form className="edit-wrapper d-flex justify-content-center align-items-start" onSubmit={handleSave}>
                <div className="edit-box">

                    {serverError && (
                        <div className="alert alert-danger">
                            {serverError}
                        </div>
                    )}

                    {/* FIRST NAME */}
                    <div className="mb-3">
                        <label className="edit-label">First Name</label>
                        <input
                            name="firstName"
                            type="text"
                            className={`form-control edit-input ${errors.firstName ? "is-invalid" : ""}`}
                            value={form.firstName}
                            onChange={handleChange}
                        />
                        {errors.firstName && <div className="invalid-feedback d-block">{errors.firstName}</div>}
                    </div>

                    {/* LAST NAME */}
                    <div className="mb-3">
                        <label className="edit-label">Last Name</label>
                        <input
                            name="lastName"
                            type="text"
                            className={`form-control edit-input ${errors.lastName ? "is-invalid" : ""}`}
                            value={form.lastName}
                            onChange={handleChange}
                        />
                        {errors.lastName && <div className="invalid-feedback d-block">{errors.lastName}</div>}
                    </div>

                    {/* PHONE NUMBER */}
                    <div className="mb-3">
                        <label className="edit-label">Phone Number</label>
                        <input
                            name="contactNumber"
                            type="text"
                            className={`form-control edit-input ${errors.contactNumber ? "is-invalid" : ""}`}
                            value={form.contactNumber}
                            onChange={handleChange}
                        />
                        {errors.contactNumber && <div className="invalid-feedback d-block">{errors.contactNumber}</div>}
                    </div>

                    {/* ADDRESS SECTION */}
                    <label className="edit-label mt-2em">Address</label>

                    <div className="row mb-3">
                        <div className="col" ref={cityRef} style={{ position: "relative" }}>
                            {/* Searchable city input */}
                            <input
                                name="city"
                                type="text"
                                className="form-control edit-input"
                                placeholder={cities.length === 0 ? "Loading cities..." : "Search or select city"}
                                value={cityQuery ?? ""}
                                onChange={handleCityInputChange}
                                onFocus={handleCityInputFocus}
                                onKeyDown={handleCityKeyDown}
                                disabled={cities.length === 0}
                                autoComplete="off"
                            />

                            {showCityDropdown && (filteredCities || []).length > 0 && (
                                <ul className="list-group position-absolute w-100" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                    {filteredCities.map((c, idx) => (
                                        <li
                                            key={c.cityId}
                                            className={`list-group-item list-group-item-action ${idx === highlightIndex ? "active" : ""}`}
                                            onMouseDown={(ev) => { ev.preventDefault(); /* prevent blur */ }}
                                            onClick={() => handleSelectCity(c)}
                                            onMouseEnter={() => setHighlightIndex(idx)}
                                        >
                                            {c.cityName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="col mb-3">
                            <input
                                name="block"
                                type="text"
                                className="form-control edit-input"
                                placeholder="Block"
                                value={form.block}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col">
                            <input
                                name="street"
                                type="text"
                                className="form-control edit-input"
                                placeholder="Road / Street"
                                value={form.street}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col">
                            <input
                                name="buildingNumber"
                                type="text"
                                className="form-control edit-input"
                                placeholder="Building / Floor"
                                value={form.buildingNumber}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button className="btn save-btn w-100 mb-3" type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    {/* RESET PASSWORD */}
                    <p className="text-center">
                        <span className="reset-disabled">Reset Password</span>
                    </p>

                </div>
            </form>
        </div>
    );
}