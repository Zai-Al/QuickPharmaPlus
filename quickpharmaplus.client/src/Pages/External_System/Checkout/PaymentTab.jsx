// src/Pages/External_System/PaymentTab.jsx
import { useState } from "react";
import formatCurrency from "../Shared_Components/formatCurrency";
import "./Checkout.css";

// Backend base URL (from launchSettings.json -> https profile)
const API_BASE_URL = "https://localhost:7231";

/**
 * Props:
 * - items: cart items (same as Checkout)
 * - shippingMode: "pickup" | "delivery"
 * - isUrgent: boolean
 */
export default function PaymentTab({
    items = [],
    shippingMode = "pickup",
    isUrgent = false,
}) {
    const [method, setMethod] = useState(""); // "cash" | "online"
    const [loading, setLoading] = useState(false);

    // --- Amount calculations ---
    const subtotal = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
    );

    // Delivery fee: 0 for pickup, 1 BHD-equivalent for delivery (+1 if urgent, just for logic)
    let deliveryFee = 0;
    if (shippingMode === "delivery") {
        deliveryFee = 1 + (isUrgent ? 1 : 0);
    }

    const total = subtotal + deliveryFee;

    const handleStripeCheckout = async () => {
        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/api/stripe/create-checkout-session`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        items: items.map((it) => ({
                            name: it.name,
                            price: it.price || 0,
                            quantity: it.quantity || 0,
                        })),
                        deliveryFee,
                        subtotal,
                        total,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    "Create session failed:",
                    response.status,
                    errorText
                );
                alert(`Payment error (${response.status}). Check backend logs.`);
                return;
            }

            const data = await response.json();

            if (data.url) {
                // New Stripe flow: redirect browser to hosted checkout page
                window.location.href = data.url;
            } else {
                console.error("No URL returned from backend:", data);
                alert("Payment session could not be created (no URL).");
            }
        } catch (error) {
            console.error("Stripe redirect error:", error);
            alert("Unexpected error while starting payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="text-start payment-container">
            <h3 className="fw-bold mb-3 text-center">Payment</h3>

            {/* Order amounts summary card */}
            <div
                className="border rounded-3 p-3 mb-4"
                style={{ maxWidth: "420px", marginInline: "auto" }}
            >
                <h5 className="fw-bold mb-3 text-center">Order Summary</h5>

                <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span className="fw-semibold">
                        {formatCurrency(subtotal)}
                    </span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Delivery Fee</span>
                    <span className="fw-semibold">
                        {formatCurrency(deliveryFee)}
                    </span>
                </div>

                <hr />

                <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total</span>
                    <span className="fw-bold">
                        {formatCurrency(total)}
                    </span>
                </div>
            </div>

            {/* Payment method selection */}
            <div
                className="border rounded-3 p-3"
                style={{ maxWidth: "480px", marginInline: "auto" }}
            >
                <h5 className="fw-bold mb-3">Choose Payment Method</h5>

                <div className="d-flex flex-column gap-3">
                    {/* Cash option */}
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="payment-cash"
                            name="paymentMethod"
                            value="cash"
                            checked={method === "cash"}
                            onChange={() => setMethod("cash")}
                        />
                        <label
                            className="form-check-label"
                            htmlFor="payment-cash"
                        >
                            Cash on Delivery
                        </label>
                    </div>

                    {/* Online payment option */}
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="payment-online"
                            name="paymentMethod"
                            value="online"
                            checked={method === "online"}
                            onChange={() => setMethod("online")}
                        />
                        <label
                            className="form-check-label"
                            htmlFor="payment-online"
                        >
                            Online Payment
                        </label>
                    </div>
                </div>

                {/* Online payment action */}
                {method === "online" && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            disabled={loading}
                            className="btn btn-primary px-5"
                            onClick={handleStripeCheckout}
                        >
                            {loading ? "Redirecting..." : "Proceed to Secure Payment"}
                        </button>
                        <p className="small text-muted mt-2">
                            You will be redirected to a secure Stripe checkout page.
                        </p>
                    </div>
                )}
            </div>

            <div className="prescription-divider" />
        </div>
    );
}
