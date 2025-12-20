// src/Pages/External_System/Checkout/PaymentTab.jsx
import formatCurrency from "../Shared_Components/formatCurrency";
import "./Checkout.css";

/**
 * Props:
 * - items: cart items
 * - shippingMode: "pickup" | "delivery"
 * - isUrgent: boolean
 * - method: "cash" | "online"
 * - onMethodChange: (method) => void
 */
export default function PaymentTab({
    items = [],
    shippingMode = "pickup",
    isUrgent = false,
    method = "cash",
    onMethodChange,
    onPayOnline,
}) {
    // --- Amount calculations ---
    // --- Amount calculations ---
    const subtotal = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
    );

    // Delivery fee: 1 BHD if delivery
    const deliveryFee = shippingMode === "delivery" ? 1 : 0;

    // Urgent fee: 1 BHD ONLY if delivery + urgent
    const urgentFee = shippingMode === "delivery" && isUrgent ? 1 : 0;

    const total = subtotal + deliveryFee + urgentFee;


    return (
        <div className="text-start payment-container">
            <h3 className="fw-bold mb-3 text-center">Payment</h3>

            {/* Order amounts summary card */}
            <div className="border rounded-3 p-3 mb-4" style={{ maxWidth: "420px", marginInline: "auto" }}>
                <h5 className="fw-bold mb-3 text-center">Order Summary</h5>

                <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal</span>
                    <span className="fw-semibold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Delivery Fee</span>
                    <span className="fw-semibold">{formatCurrency(deliveryFee)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span>Urgent Fee</span>
                    <span className="fw-semibold">{formatCurrency(urgentFee)}</span>
                </div>


                <hr />

                <div className="d-flex justify-content-between">
                    <span className="fw-bold">Total</span>
                    <span className="fw-bold">{formatCurrency(total)}</span>
                </div>

                {/* optional info */}
                {shippingMode === "delivery" && isUrgent && (
                    <div className="small text-muted mt-2">Urgent delivery selected.</div>
                )}
            </div>

            {/* Payment method selection */}
            <div className="border rounded-3 p-3" style={{ maxWidth: "480px", marginInline: "auto" }}>
                <h5 className="fw-bold mb-3">Choose Payment Method</h5>

                <div className="d-flex flex-column gap-3">
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="payment-cash"
                            name="paymentMethod"
                            value="cash"
                            checked={method === "cash"}
                            onChange={() => onMethodChange?.("cash")}
                        />
                        <label className="form-check-label" htmlFor="payment-cash">
                            Cash on Delivery / Pickup
                        </label>
                    </div>

                    {/* keep online option visible but you’re not using it now */}
                    <div className="form-check">
                        <input
                            className="form-check-input"
                            type="radio"
                            id="payment-online"
                            name="paymentMethod"
                            value="online"
                            checked={method === "online"}
                            onChange={() => onMethodChange?.("online")}
                        />
                        <label className="form-check-label" htmlFor="payment-online">
                            Online Payment (Stripe later)
                        </label>
                    </div>

                    {method === "online" && (
                        <div className="d-flex flex-column gap-2">
                            <div className="alert alert-info small mb-0">
                                You will be redirected to Stripe to complete payment.
                            </div>

                            <button
                                type="button"
                                className="btn qp-add-btn"
                                onClick={() => onPayOnline?.()}
                            >
                                Pay Online
                            </button>
                        </div>
                    )}

                </div>
            </div>

            <div className="prescription-divider" />
        </div>
    );
}