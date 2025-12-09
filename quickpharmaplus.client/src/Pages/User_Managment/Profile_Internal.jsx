import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../Context/AuthContext.jsx";
import "./Profile_Internal.css";

export default function Profile_Internal() {
    const { user: ctxUser, setUser } = useContext(AuthContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Accept user passed via route state first, otherwise fall back to AuthContext
    const passedUser = location.state?.user;
    const user = passedUser ?? ctxUser ?? {};

    // Compose display values with safe fallbacks for different possible shapes
    const firstName = user?.firstName ?? user?.givenName ?? user?.name ?? user?.FirstName ?? "";
    const lastName = user?.lastName ?? user?.familyName ?? user?.LastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim() || user?.username || "User";

    // include server field names (contactNumber / ContactNumber) as fallbacks
    const phoneNumber =
        user?.contactNumber ??
        user?.ContactNumber ??
        user?.phoneNumber ??
        user?.phone ??
        user?.contact?.phone ??
        user?.ContactNumber ??
        "";

    // Extract address object (supports backend naming variations)
    const addr = user?.address ?? user?.Address ?? null;

    // Get city safely (nested or flat)
    const city =
        addr?.city?.cityName ??
        addr?.city?.CityName ??
        addr?.city ??
        "";

    // Get other address fields (supports different casing patterns)
    const block =
        addr?.block ??
        addr?.Block ??
        "";

    const street =
        addr?.street ??
        addr?.Street ??
        "";

    const building =
        addr?.buildingNumber ??
        addr?.BuildingNumber ??
        "";

    // Build supplier-style formatted address:
    // City / Block No. X / Road No. Y / Building No. Z
    const formattedParts = [];

    if (city) formattedParts.push(city);
    if (block) formattedParts.push(`Block No. ${block}`);
    if (street) formattedParts.push(`Road No. ${street}`);
    if (building) formattedParts.push(`Building No. ${building}`);

    const addressDisplay =
        formattedParts.length > 0
            ? formattedParts.join(" / ")
            : typeof addr === "string"
                ? addr
                : user?.address ?? "";

    // Logout handler: call server logout, clear client state and sessionStorage then redirect
    const handleLogout = async (e) => {
        e.preventDefault();

        try {
            const baseURL = import.meta.env.VITE_API_BASE_URL;
            await fetch(`${baseURL}/api/account/logout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            // Clear client-side auth
            setUser(null);
            sessionStorage.removeItem("user");

            // Redirect to login
            navigate("/login");
        } catch (err) {
            console.error("Logout failed:", err);
            // still clear client state to avoid stuck UI
            setUser(null);
            sessionStorage.removeItem("user");
            navigate("/login");
        }
    };

    return (
        <div className="profile-page">
            {/* LOGOUT BUTTON TOP-RIGHT */}
            <div className="logout-container">
                <button
                    onClick={handleLogout}
                    className="btn btn-dark d-flex align-items-center gap-2 px-3 py-2 logout-btn"
                >
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                </button>
            </div>

            {/* PAGE TITLE */}
            <div className="profile-header text-center">
                <h1 className="fw-bold">User Profile</h1>
                <h3 className="welcome-text">Welcome {fullName}!</h3>
            </div>

            {/* PROFILE FORM BOX */}
            <div className="profile-wrapper d-flex justify-content-center align-items-start">
                <div className="profile-box">

                    <div className="mb-4">
                        <label className="profile-label">Name</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            value={fullName}
                            disabled
                        />
                    </div>

                    <div className="mb-4">
                        <label className="profile-label">Phone Number</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            value={phoneNumber ?? ""}
                            placeholder="Phone Number"
                            disabled
                        />
                    </div>

                    <div className="mb-4">
                        <label className="profile-label">Address</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            value={addressDisplay ?? ""}
                            placeholder="Address"
                            disabled
                        />
                    </div>

                    <Link
                        to={{
                            pathname: "/editProfileInternal",
                            state: { user }
                        }}
                        className="btn w-100 edit-btn mb-3 text-center"
                    >
                        Edit
                    </Link>

                    {/* RESET PASSWORD BUTTON */}
                    <div className="text-center mt-2">
                        <Link to="/resetpassword" className="reset-link">
                            Reset Password
                        </Link>
                    </div>

                </div> {/* <-- closes profile-box */}
            </div> {/* <-- closes profile-wrapper */}
        </div>
    );
}
