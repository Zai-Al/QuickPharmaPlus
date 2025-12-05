import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../../Context/AuthContext.jsx";
import ConfirmModal from "../../Components/InternalSystem/Modals/ConfirmModal.jsx";
import "./Reset_Password.css";

export default function ResetPasswordInternal() {
    const navigate = useNavigate();
    const { user, setUser } = useContext(AuthContext);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [fieldErrors, setFieldErrors] = useState({ current: "", new: "", confirm: "" });
    const [serverMessage, setServerMessage] = useState("");
    const [showModal, setShowModal] = useState(false);

    const [validating, setValidating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const validateTimer = useRef(null);
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? "";

    // If not logged in, redirect to login immediately
    useEffect(() => {
        if (!user) {
            navigate("/login", { replace: true });
        }
    }, [user, navigate]);

    // Debounced online password-policy validation against server
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
                const res = await fetch(`${baseURL}/api/account/validate-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ password: newPassword })
                });

                setValidating(false);

                if (res.ok) {
                    const payload = await res.json();
                    if (payload?.errors && payload.errors.length > 0) {
                        setFieldErrors(prev => ({ ...prev, new: payload.errors.join(" ") }));
                    } else {
                        setFieldErrors(prev => ({ ...prev, new: "" }));
                    }
                } else if (res.status === 401) {
                    setFieldErrors(prev => ({ ...prev, new: "Unauthorized — please sign in again." }));
                } else {
                    setFieldErrors(prev => ({ ...prev, new: "Password validation failed (server)." }));
                }
            } catch (err) {
                setValidating(false);
                setFieldErrors(prev => ({ ...prev, new: "Validation network error, " + err.message }));
            }
        }, 400);

        return () => {
            if (validateTimer.current) clearTimeout(validateTimer.current);
        };
    }, [newPassword, baseURL]);

    // Confirm password local check
    useEffect(() => {
        if (!confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirm: "" }));
            return;
        }
        setFieldErrors(prev => ({ ...prev, confirm: newPassword === confirmPassword ? "" : "Passwords do not match." }));
    }, [confirmPassword, newPassword]);

    const logoutClient = () => {
        sessionStorage.removeItem("user");
        if (typeof setUser === "function") setUser(null);
        navigate("/login", { replace: true });
    };

    const handleModalConfirm = () => {
        setShowModal(false);
        // Ensure logout after user acknowledges
        logoutClient();
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        setServerMessage("");

        const localErrors = {
            current: !currentPassword ? "Current password is required." : "",
            new: !newPassword ? "New password is required." : fieldErrors.new || "",
            confirm: !confirmPassword ? "Confirm password is required." : (newPassword !== confirmPassword ? "Passwords do not match." : "")
        };
        setFieldErrors(localErrors);
        if (localErrors.current || localErrors.new || localErrors.confirm) return;

        setSubmitting(true);

        try {
            const res = await fetch(`${baseURL}/api/account/change-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });

            if (res.ok) {
                setServerMessage("Password changed successfully. Please log in again.");
                // show modal popup on this page, require user acknowledgement before logout
                setShowModal(true);
            } else {
                const payload = await res.json().catch(() => null);

                if (payload?.errors) {
                    const newFieldErrors = { current: "", new: "", confirm: "" };
                    const others = [];

                    for (const err of payload.errors) {
                        const msg = err?.description ?? err;
                        if (/current|old password/i.test(msg)) newFieldErrors.current += msg + " ";
                        else if (/confirm|match/i.test(msg)) newFieldErrors.confirm += msg + " ";
                        else if (/password/i.test(msg) || /character/i.test(msg) || /uppercase|digit|non-alphanumeric/i.test(msg)) newFieldErrors.new += msg + " ";
                        else others.push(msg);
                    }

                    setFieldErrors(prev => ({ ...prev, ...newFieldErrors }));
                    setServerMessage(others.join(" ") || "Failed to change password.");
                } else {
                    const text = await res.text().catch(() => "Failed to change password.");
                    setServerMessage(text);
                }
            }
        } catch (err) {
            setServerMessage("Network error while changing password, " + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="reset-page">
            <div className="reset-page-title">
                <h1>Reset Password</h1>
            </div>

            <div className="reset-cancel-wrapper">
                <button className="btn btn-warning reset-cancel-btn"
                    onClick={() => navigate("/profileInternal")}>
                    <i className="bi bi-x-lg"></i> Cancel
                </button>
            </div>

            <div className="reset-container">
                <form className="reset-form" onSubmit={onSubmit} noValidate>

                    <div className="mb-3">
                        <label htmlFor="currentPassword" className="form-label fw-semibold mt-4">Current Password</label>
                        <input id="currentPassword" type="password" className={`form-control ${fieldErrors.current ? "is-invalid" : ""}`}
                            placeholder="Enter your current password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)} />
                        {fieldErrors.current && <div className="invalid-feedback">{fieldErrors.current}</div>}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="newPassword" className="form-label fw-semibold mt-4">New Password</label>
                        <input id="newPassword" type="password" className={`form-control ${fieldErrors.new ? "is-invalid" : (newPassword ? "is-valid" : "")}`}
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)} />
                        {validating && <div className="form-text">Checking password rules…</div>}
                        {fieldErrors.new && <div className="invalid-feedback">{fieldErrors.new}</div>}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="form-label fw-semibold mt-4">Confirm Password</label>
                        <input id="confirmPassword" type="password" className={`form-control ${fieldErrors.confirm ? "is-invalid" : ""}`}
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)} />
                        {fieldErrors.confirm && <div className="invalid-feedback">{fieldErrors.confirm}</div>}
                    </div>

                    {serverMessage && !showModal && (
                        <div className="alert alert-danger alert-dismissible">
                            <button type="button" className="btn-close" data-bs-dismiss="alert"></button>
                            <strong>Error! </strong> {serverMessage}
                        </div>
                    )}

                    <button type="submit" className="btn reset-submit-btn w-100 mt-4" disabled={submitting || validating}>
                        {submitting ? "Saving…" : "Reset Password"}
                    </button>
                </form>
            </div>

            <ConfirmModal
                show={showModal}
                title="Password Changed"
                body={serverMessage || "Password changed successfully. Please log in again."}
                confirmLabel="OK"
                onConfirm={handleModalConfirm}
                onCancel={handleModalConfirm}
            />
        </div>
    );
}
