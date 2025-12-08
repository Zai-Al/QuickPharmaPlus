import { useNavigate } from "react-router-dom";
import { useState } from "react";
import ConfirmModal from "../../Components/InternalSystem/Modals/ConfirmModal.jsx";
import "./Forgot_Password.css";

export default function ForgotPassword() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [serverMessage, setServerMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

    const validateEmail = (value) => {
        if (!value?.trim()) return "Email is required.";
        // simple email pattern
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value.trim())) return "Enter a valid email address.";
        return "";
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setServerMessage("");
        const err = validateEmail(email);
        setEmailError(err);
        if (err) return;

        setSubmitting(true);
        try {
            const res = await fetch(`${baseURL}/api/account/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() })
            });

            if (res.ok) {
                // consistent UX: inform user that an email was sent (do not reveal account existence)
                setServerMessage("If an account with that email exists, a reset link was sent. Check your inbox.");
                setShowModal(true);
            } else {
                const payload = await res.json().catch(() => null);
                if (payload?.errors) {
                    setServerMessage(Array.isArray(payload.errors) ? payload.errors.join(" ") : String(payload.errors));
                } else {
                    const txt = await res.text().catch(() => "Failed to send reset link.");
                    setServerMessage(txt);
                }
            }
        } catch (err) {
            setServerMessage("Network error. Please try again later, " + (err?.message ?? String(err)));
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalConfirm = () => {
        setShowModal(false);
        navigate("/login", { replace: true });
    };

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
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label fr-label mt-4">
                                Enter your email and we will send you reset instructions.
                            </label>
                            <input
                                type="email"
                                className={`form-control fr-input mt-2 ${emailError ? "is-invalid" : ""}`}
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (emailError) setEmailError(validateEmail(e.target.value));
                                }}
                                aria-invalid={!!emailError}
                                aria-describedby="forgot-email-error"
                            />
                            {emailError && <div id="forgot-email-error" className="invalid-feedback d-block">{emailError}</div>}
                        </div>

                        {serverMessage && !showModal && (
                            <div className="alert alert-danger alert-dismissible">
                                <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                                <strong>Info:</strong> {serverMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-100 fr-btn mt-4"
                            disabled={submitting}
                        >
                            {submitting ? "Sending…" : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </div>

            <ConfirmModal
                show={showModal}
                title="Reset Link Sent"
                body={serverMessage || "If an account with that email exists, a reset link was sent."}
                confirmLabel="OK"
                onConfirm={handleModalConfirm}
                onCancel={handleModalConfirm}
            />
        </div>
    );
}
