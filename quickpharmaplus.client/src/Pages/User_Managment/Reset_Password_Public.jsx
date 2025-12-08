import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import ConfirmModal from "../../Components/InternalSystem/Modals/ConfirmModal.jsx";
import "./Reset_Password.css";

export default function ResetPasswordPublic() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [fieldErrors, setFieldErrors] = useState({ new: "", confirm: "" });
    const [serverMessage, setServerMessage] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // LIVE VALIDATION STATE
    const [validating, setValidating] = useState(false);
    const validateTimer = useRef(null);

    const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

    // Load email and token from URL
    useEffect(() => {
        const qp = new URLSearchParams(location.search);
        setEmail(qp.get("email") ?? "");
        setToken(qp.get("token") ? decodeURIComponent(qp.get("token")) : "");
    }, [location.search]);

    // Confirm password validation
    useEffect(() => {
        setFieldErrors(prev => ({
            ...prev,
            confirm: confirmPassword && newPassword !== confirmPassword
                ? "Passwords do not match."
                : ""
        }));
    }, [confirmPassword, newPassword]);

    // LIVE PASSWORD VALIDATION
    useEffect(() => {
        setFieldErrors(prev => ({ ...prev, new: "" }));
        setServerMessage("");

        if (!newPassword) {
            setValidating(false);
            return;
        }

        setValidating(true);
        if (validateTimer.current) clearTimeout(validateTimer.current);

        validateTimer.current = setTimeout(async () => {
            try {
                const res = await fetch(`${baseURL}/api/account/validate-password-public`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: newPassword })
                });

                setValidating(false);

                if (res.ok) {
                    const payload = await res.json();
                    if (payload?.errors?.length > 0) {
                        setFieldErrors(prev => ({
                            ...prev,
                            new: payload.errors.join(" ")
                        }));
                    } else {
                        setFieldErrors(prev => ({ ...prev, new: "" }));
                    }
                } else {
                    const errorText = await res.text().catch(() => null);
                    setFieldErrors(prev => ({
                        ...prev,
                        new: errorText || "Password validation failed (server)."
                    }));
                }
            } catch (err) {
                setValidating(false);
                setFieldErrors(prev => ({
                    ...prev,
                    new: "Validation error: " + err.message
                }));
            }
        }, 400);

        return () => {
            if (validateTimer.current) clearTimeout(validateTimer.current);
        };
    }, [newPassword, baseURL]);

    // FORM SUBMIT
    const handleSubmit = async (e) => {
        e.preventDefault();
        setServerMessage("");

        const newErr = !newPassword ? "New password is required." : fieldErrors.new;
        const confErr = !confirmPassword
            ? "Confirm password is required."
            : (newPassword !== confirmPassword ? "Passwords do not match." : "");

        setFieldErrors({ new: newErr, confirm: confErr });

        if (newErr || confErr) return;

        setSubmitting(true);

        try {
            const res = await fetch(`${baseURL}/api/account/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    token,
                    newPassword,
                    confirmPassword
                })
            });

            if (res.ok) {
                setServerMessage("Password reset successfully. Please sign in with your new password.");
                setShowModal(true);
            } else {
                const payload = await res.json().catch(() => null);
                if (payload?.errors) {
                    const msgs = Array.isArray(payload.errors)
                        ? payload.errors.map(e => e?.description ?? e).join(" ")
                        : String(payload.errors);

                    setServerMessage(msgs || "Failed to reset password.");
                } else {
                    setServerMessage(await res.text().catch(() => "Failed to reset password."));
                }
            }
        } catch (err) {
            setServerMessage("Network error: " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalConfirm = () => {
        setShowModal(false);
        navigate("/login", { replace: true });
    };

    return (
        <div className="reset-page">
            <div className="reset-page-title">
                <h1>Reset Password</h1>
            </div>

            <div className="reset-container">
                <form className="reset-form" onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                        <label className="form-label fw-semibold mt-4">Email</label>
                        <input type="email" className="form-control" value={email} disabled />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold mt-4">New Password</label>
                        <input
                            type="password"
                            className={`form-control ${fieldErrors.new ? "is-invalid" : (newPassword ? "is-valid" : "")}`}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />

                        {validating && <div className="form-text">Checking password rules…</div>}
                        {fieldErrors.new && <div className="invalid-feedback">{fieldErrors.new}</div>}
                    </div>

                    <div className="mb-4">
                        <label className="form-label fw-semibold mt-4">Confirm Password</label>
                        <input
                            type="password"
                            className={`form-control ${fieldErrors.confirm ? "is-invalid" : ""}`}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                        {fieldErrors.confirm && <div className="invalid-feedback">{fieldErrors.confirm}</div>}
                    </div>

                    {serverMessage && !showModal && (
                        <div className="alert alert-danger alert-dismissible">
                            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                            <strong>Info: </strong> {serverMessage}
                        </div>
                    )}

                    <button type="submit" className="btn reset-submit-btn w-100 mt-4" disabled={submitting || validating}>
                        {submitting ? "Saving" : "Reset Password"}
                    </button>
                </form>
            </div>

            <ConfirmModal
                show={showModal}
                title="Password Reset"
                body={serverMessage || "Password reset successfully."}
                confirmLabel="OK"
                onConfirm={handleModalConfirm}
                onCancel={handleModalConfirm}
            />
        </div>
    );
}
