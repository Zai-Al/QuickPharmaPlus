import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Details.css";

export default function RejectButton({ id }) {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    const modalId = useMemo(() => `rejectPrescriptionModal_${id}`, [id]);

    const [reason, setReason] = useState("");
    const [sending, setSending] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleOpen = () => {
        setReason("");
        setErrorMsg("");
    };

    const cleanupBootstrapModalArtifacts = () => {
        // remove any leftover backdrops
        document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());

        // remove body locks bootstrap applies
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("overflow");
        document.body.style.removeProperty("padding-right");
    };

    const hideModalSafely = () => {
        const el = document.getElementById(modalId);
        if (!el) {
            cleanupBootstrapModalArtifacts();
            return;
        }

        // Hide modal (Bootstrap)
        if (window.bootstrap?.Modal) {
            const instance =
                window.bootstrap.Modal.getInstance(el) || new window.bootstrap.Modal(el);

            instance.hide();
        } else {
            // fallback
            el.classList.remove("show");
            el.style.display = "none";
            el.setAttribute("aria-hidden", "true");
        }

        // Ensure UI is clean even if we navigate immediately
        cleanupBootstrapModalArtifacts();
    };

    const handleSend = async () => {
        if (!id) return;

        const trimmed = reason.trim();
        if (!trimmed) {
            setErrorMsg("Rejection reason is required.");
            return;
        }

        try {
            setSending(true);
            setErrorMsg("");

            const res = await fetch(
                `${baseURL}/api/Prescription/${encodeURIComponent(id)}/reject`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ reason: trimmed }),
                }
            );

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || `Failed to reject prescription (${res.status}).`);
            }

            // IMPORTANT: cleanup BEFORE routing
            hideModalSafely();

            navigate("/prescriptions");
        } catch (e) {
            setErrorMsg(e?.message || "Failed to reject prescription.");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <button
                className="reject-btn"
                type="button"
                data-bs-toggle="modal"
                data-bs-target={`#${modalId}`}
                onClick={handleOpen}
            >
                <i className="bi bi-x-circle"></i> Reject
            </button>

            <div className="modal fade" id={modalId} tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reject Prescription</h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                onClick={hideModalSafely}
                            ></button>
                        </div>

                        <div className="modal-body">
                            <label className="form-label fw-semibold">Reason for rejection</label>
                            <textarea
                                className={`form-control ${errorMsg ? "is-invalid" : ""}`}
                                rows="4"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Enter rejection reason..."
                                disabled={sending}
                            />
                            {errorMsg && <div className="invalid-feedback d-block">{errorMsg}</div>}
                        </div>

                        <div className="modal-footer justify-content-center">
                            <button
                                type="button"
                                className="reject-modal-btn reject-modal-cancel-btn"
                                data-bs-dismiss="modal"
                                disabled={sending}
                                onClick={hideModalSafely}
                            >
                                <i className="bi bi-x-circle"></i> Cancel
                            </button>

                            <button
                                type="button"
                                className="reject-modal-btn reject-modal-send-btn"
                                onClick={handleSend}
                                disabled={sending}
                            >
                                <i className="bi bi-send"></i> {sending ? "Sending..." : "Send"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
