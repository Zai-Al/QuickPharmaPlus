import { useNavigate } from "react-router-dom";
import "./Forgot_Password.css";

export default function ForgotPassword() {
    const navigate = useNavigate();

    return (
        <div className="fr-page">

            {/* PAGE HEADER (Title + Cancel Button) */}
            <div className="fr-header">
                <h1 className="fr-title">Forgot Password</h1>

                <button
                    className="btn btn-warning fr-cancel-btn"
                    onClick={() => navigate("/login")}
                >
                    <i className="bi bi-x-lg me-1"></i> Cancel
                </button>
            </div>

            {/* FORM CONTAINER */}
            <div className="fr-center-container">
                <div className="fr-box">

                    {/* EMAIL */}
                    <div className="mb-4">
                        <label className="form-label fr-label mt-4"> Enter your email and we will send you reset instructions.</label>
                        <input
                            type="email"
                            className="form-control fr-input mt-2"
                            placeholder="Enter your email"
                        />
                    </div>

                    <button className="btn btn-primary w-100 fr-btn mt-4">
                        Send Reset Link
                    </button>

                </div>
            </div>

        </div>
    );
}
