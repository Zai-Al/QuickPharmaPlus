// src/Pages/External_System/Checkout/CheckoutSession.jsx
import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { CartContext } from "../../../Context/CartContext.jsx";

const DRAFT_KEY = "qp_checkout_draft_v1";

const loadDraft = () => {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export default function CheckoutSuccess() {
    const navigate = useNavigate();
    const [sp] = useSearchParams();
    const { user } = useContext(AuthContext);
    const { refreshCartCount } = useContext(CartContext);

    const authUserId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const [msg, setMsg] = useState("Confirming payment...");
    const [debug, setDebug] = useState(null);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    // ? Prevent double-run in React StrictMode (dev)
    const ranRef = useRef(false);

    useEffect(() => {
        // ? Guard: do not run twice
        if (ranRef.current) return;
        ranRef.current = true;

        (async () => {
            try {
                setDebug({
                    step: "mounted",
                    hasAuthUser: !!user,
                    authUserId,
                    url: window.location.href,
                });

                const sessionId = sp.get("session_id");
                if (!sessionId) {
                    setMsg("Missing Stripe session id.");
                    setDebug({ step: "payment-success", error: "no session_id in URL" });
                    return;
                }

                const draft = loadDraft();
                if (!draft) {
                    setMsg("Checkout draft missing (sessionStorage).");
                    setDebug({ step: "draft", error: `${DRAFT_KEY} missing in sessionStorage` });
                    return;
                }

                // If /payment-success route is outside AuthProvider, user may be null.
                // So fall back to stored userId saved in draft before redirect.
                const storedUserId = draft?._userId ?? draft?.userId ?? null;
                const finalUserId = authUserId ?? storedUserId;

                if (!finalUserId) {
                    setMsg("Not logged in (userId missing).");
                    setDebug({ step: "auth", authUserId, storedUserId });
                    return;
                }

                // Verify Stripe session is paid (requires api/stripe/verify-session)
                setMsg("Verifying Stripe session...");
                const vres = await fetch(
                    `${API_BASE}/api/stripe/verify-session?sessionId=${encodeURIComponent(sessionId)}`,
                    { credentials: "include" }
                );

                const vjson = await vres.json().catch(() => ({}));

                if (!vres.ok || vjson?.paid !== true) {
                    setMsg("Stripe payment not confirmed by server.");
                    setDebug({ step: "verify-session", status: vres.status, vjson });
                    return;
                }

                // Build payload (same shape as cash flow)
                const ship = draft?.shipping || {};
                const fd = new FormData();

                fd.append("UserId", String(finalUserId));
                fd.append("Mode", String(ship.Mode ?? ship.mode ?? "pickup"));

                // pickup
                const pickupBranchId = ship.PickupBranchId ?? ship.pickupBranchId;
                if (pickupBranchId != null) fd.append("PickupBranchId", String(pickupBranchId));

                // delivery fields
                const useSaved = ship.UseSavedAddress ?? ship.useSavedAddress ?? false;
                fd.append("UseSavedAddress", String(!!useSaved));

                const cityId = ship.CityId ?? ship.cityId;
                if (cityId != null) fd.append("CityId", String(cityId));

                const block = ship.Block ?? ship.block;
                if (block != null) fd.append("Block", String(block));

                const road = ship.Road ?? ship.road;
                if (road != null) fd.append("Road", String(road));

                const buildingFloor = ship.BuildingFloor ?? ship.buildingFloor;
                if (buildingFloor != null) fd.append("BuildingFloor", String(buildingFloor));

                // schedule
                const urgent = ship.IsUrgent ?? ship.isUrgent ?? false;
                fd.append("IsUrgent", String(!!urgent));

                const shippingDate = ship.ShippingDate ?? ship.shippingDate;
                if (shippingDate) fd.append("ShippingDate", String(shippingDate));

                const slotId = ship.SlotId ?? ship.slotId;
                if (slotId != null) fd.append("SlotId", String(slotId));

                // prescription (if exists)
                if (draft?.prescription?.ApprovedPrescriptionId != null) {
                    fd.append("ApprovedPrescriptionId", String(draft.prescription.ApprovedPrescriptionId));
                    fd.append("IsHealthProfile", String(!!draft.prescription.IsHealthProfile));
                } else {
                    fd.append("IsHealthProfile", "false");
                }

                fd.append("UploadNewPrescription", "false");

                // Payment markers (requires fields in CheckoutCreateOrderRequestDto)
                fd.append("PaymentMethod", "online");
                fd.append("StripeSessionId", sessionId);

                setMsg("Creating your order...");
                const res = await fetch(`${API_BASE}/api/CheckoutOrder/create`, {
                    method: "POST",
                    credentials: "include",
                    body: fd,
                });

                const json = await res.json().catch(() => ({}));

                if (!res.ok || json?.created !== true) {
                    setMsg("Order creation failed.");
                    setDebug({ step: "create-order", status: res.status, json });
                    return;
                }

                sessionStorage.removeItem(DRAFT_KEY);
                refreshCartCount?.();
                navigate(`/myOrderDetails/${json.orderId}`, { replace: true });
            } catch (e) {
                setMsg("Unexpected error on payment-success.");
                setDebug({ step: "catch", message: e?.message || String(e) });
            }
        })();
    }, [API_BASE, navigate, sp, authUserId, user]);

    return (
        <div style={{ padding: 24 }}>
            <div style={{ fontSize: 18, marginBottom: 12 }}>{msg}</div>

            {debug && (
                <pre
                    style={{
                        textAlign: "left",
                        background: "#f6f6f6",
                        padding: 12,
                        borderRadius: 8,
                        overflowX: "auto",
                    }}
                >
                    {JSON.stringify(debug, null, 2)}
                </pre>
            )}

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button onClick={() => navigate("/checkout?tab=payment")}>Back to Payment</button>
                <button onClick={() => navigate("/checkout?tab=shipping")}>Back to Shipping</button>
            </div>
        </div>
    );
}
