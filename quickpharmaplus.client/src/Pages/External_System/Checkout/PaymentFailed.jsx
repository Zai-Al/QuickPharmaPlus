// src/Pages/External_System/Checkout/PaymentFailed.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const DRAFT_KEY = "qp_checkout_draft_v1";

export default function PaymentFailed() {
    const navigate = useNavigate();

    useEffect(() => {
        // Give user a moment to see the message, then return to checkout payment tab
        const t = setTimeout(() => {
            navigate("/checkout?tab=payment", { replace: true });
        }, 2000);

        return () => clearTimeout(t);
    }, [navigate]);

    return (
        <div className="container pt-5 text-center">
            <h3 className="fw-bold text-danger mb-2">Payment Cancelled</h3>
            <p className="mb-3">
                You cancelled the payment or pressed back on Stripe.
            </p>
            <p className="text-muted">
                Returning you to the payment step…
            </p>
        </div>
    );
}
