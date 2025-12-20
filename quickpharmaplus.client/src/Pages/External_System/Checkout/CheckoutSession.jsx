// CheckoutSuccess.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { buildCreateOrderFormData } from "./checkoutUtils";

const DRAFT_KEY = "qp_checkout_draft_v1";
const loadDraft = () => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
};

export default function CheckoutSuccess() {
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const [msg, setMsg] = useState("Confirming payment...");

    const fd = buildCreateOrderFormData(draft, userId);

    await fetch(`${API_BASE}/api/CheckoutOrder/create`, {
        method: "POST",
        credentials: "include",
        body: fd,
    });

    useEffect(() => {
        (async () => {
            const sessionId = sp.get("session_id");
            if (!sessionId) { setMsg("Missing session id."); return; }

            const draft = loadDraft();
            if (!draft) { setMsg("Checkout data expired."); return; }

            // 1) verify paid (you add /api/stripe/verify)
            const v = await fetch(`${API_BASE}/api/stripe/verify?sessionId=${encodeURIComponent(sessionId)}`, {
                credentials: "include",
            });
            const vj = await v.json().catch(() => ({}));
            if (!v.ok || vj?.paid !== true) {
                setMsg("Payment not verified. Returning to payment...");
                navigate("/checkout?tab=payment", { replace: true });
                return;
            }

            // 2) create order
            const fd = buildCreateOrderFormData(draft, /* userId */);
            const res = await fetch(`${API_BASE}/api/CheckoutOrder/create`, {
                method: "POST",
                credentials: "include",
                body: fd,
            });
            const json = await res.json().catch(() => ({}));

            if (!res.ok || json?.created !== true) {
                setMsg(json?.message || "Order creation failed. Returning to payment...");
                navigate("/checkout?tab=payment", { replace: true });
                return;
            }

            // 3) cleanup + redirect to order details
            sessionStorage.removeItem(DRAFT_KEY);
            navigate(`/orders/${json.orderId}`, { replace: true });
        })();
    }, [sp, navigate]);

    return <div style={{ padding: 24 }}>{msg}</div>;
}
