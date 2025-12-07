import { Link } from "react-router-dom";
import "./Profile_Internal.css";

export default function Profile_Internal() {

    const loggedInUser = "AdminUser";

    return (
        <div className="profile-page">


            {/* LOGOUT BUTTON TOP-RIGHT */}
            <div className="logout-container">
                <Link
                    to="/login"
                    className="btn btn-dark d-flex align-items-center gap-2 px-3 py-2 logout-btn"
                // TODO: Add ASP.NET session termination logic here
                // Example: call API: /api/account/logout
                >
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                </Link>
            </div>

            {/* PAGE TITLE */}
            <div className="profile-header text-center">
                <h1 className="fw-bold">User Profile</h1>
                <h3 className="welcome-text">Welcome {loggedInUser}!</h3>
            </div>

            {/* PROFILE FORM BOX */}
            <div className="profile-wrapper d-flex justify-content-center align-items-start">
                <div className="profile-box">

                    <div className="mb-4">
                        <label className="profile-label">Name</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            value={loggedInUser}
                            disabled
                        />
                    </div>

                    <div className="mb-4">
                        <label className="profile-label">Phone Number</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            placeholder="Phone Number"
                            disabled
                        />
                    </div>

                    <div className="mb-4">
                        <label className="profile-label">Address</label>
                        <input
                            type="text"
                            className="form-control profile-input"
                            placeholder="Address"
                            disabled
                        />
                    </div>

                    <Link to="/editProfileInternal" className="btn w-100 edit-btn mb-3 text-center">
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

        </div> // <-- closes profile-page
    );
}
