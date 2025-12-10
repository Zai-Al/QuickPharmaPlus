// src/Pages/User_Management/ExternalProfile.jsx
import { useState, useContext } from "react";
import PageHeader from "../External_System/Shared_Components/PageHeader";
import AddressFields from "../External_System/Shared_Components/AddressFields";
import { AuthContext } from "../../Context/AuthContext";
import "./ExternalProfile.css";

export default function ExternalProfile() {
    const { logout, user } = useContext(AuthContext);

    const [mode, setMode] = useState("view"); // "view" | "edit"

    const [profileData, setProfileData] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
        city: user?.city || "",
        block: user?.block || "",
        road: user?.road || "",
        buildingFloor: user?.buildingFloor || "",
    });

    const disabled = mode === "view";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const handleLogout = () => {
        logout();
    };

    const handleEdit = () => setMode("edit");
    const handleCancel = () => setMode("view");
    const handleSave = () => {
        // later: call API to save profileData
        console.log("Save profile", profileData);
        setMode("view");
    };

    const handleDelete = () => {
        // later: show confirmation + call API
        console.log("Delete profile");
    };

    const handleResetPassword = () => {
        // later: navigate to reset password page or open modal
        console.log("Reset password");
    };

    return (
        <>
            <PageHeader title="Profile" />

            <div className="container my-5">
                {/* Welcome + Logout only */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold m-0">
                        Welcome {profileData.firstName || "User"}!
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

                {/* Card */}
                <div className="card shadow-sm">
                    <div className="card-body py-4 px-5">
                        <h4 className="fw-bold mb-4">Profile Details</h4>

                        {/* First & Last Name Row */}
                        <div className="row mb-3 profile-row">
                            <div className="col-md-6">
                                <label className="fw-bold">First Name:</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    className="form-control profile-input"
                                    value={profileData.firstName}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Last Name:</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    className="form-control profile-input"
                                    value={profileData.lastName}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        {/* Email & Phone Row */}
                        <div className="row mb-4 profile-row">
                            <div className="col-md-6">
                                <label className="fw-bold">Email:</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-control profile-input"
                                    value={profileData.email}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="fw-bold">Phone:</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-control profile-input"
                                    value={profileData.phone}
                                    onChange={handleChange}
                                    disabled={disabled}
                                />
                            </div>
                        </div>

                        {/* Address section */}
                        <AddressFields
                            title="Address"
                            formData={profileData}
                            handleChange={handleChange}
                            disabled={disabled}
                        />

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
            </div>
        </>
    );
}
