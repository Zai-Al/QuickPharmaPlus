import { useNavigate } from "react-router-dom";
import "./Reset_Password.css";

export default function ResetPasswordInternal() {

    const navigate = useNavigate();

    return (
        <div className="reset-page">

            {/* TOP PAGE TITLE */}
            <div className="reset-page-title">
                <h1>Reset Password</h1>
            </div>

            {/* CANCEL BUTTON (top-right) */}
            <div className="reset-cancel-wrapper">
                <button className="btn btn-warning reset-cancel-btn"
                    onClick={() => navigate("/profileInternal")}>
                    <i className="bi bi-x-lg"></i> Cancel
                </button>
            </div>

            {/* FORM CONTAINER */}
            <div className="reset-container">

                {/* FORM FIELDS */}
                <form className="reset-form">

                    <div className="mb-3">
                        <label className="form-label fw-semibold mt-4">Current Password</label>
                        <input type="password" className="form-control" placeholder="Enter your current password" />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold mt-4">New Password</label>
                        <input type="password" className="form-control" placeholder="Enter new password" />
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-semibold mt-4">Confirm Password</label>
                        <input type="password" className="form-control" placeholder="Confirm new password" />
                    </div>

                    <button className="btn reset-submit-btn w-100 mt-4">Reset Password</button>
                </form>
            </div>
        </div>
    );
}
