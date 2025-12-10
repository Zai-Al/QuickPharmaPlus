// src/Pages/External_System/Checkout.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import PageHeader from "../Shared_Components/PageHeader";
import NavigationTab from "../Shared_Components/NavigationTab";
import DialogModal from "../Shared_Components/DialogModal";

import OrderSummaryTab from "./OrderSummaryTab";
import CheckoutPrescriptionTab from "./CheckoutPrescriptionTab";
import ShippingTab from "./ShippingTab";
import PaymentTab from "./PaymentTab";

import "../Shared_Components/External_Style.css";

export default function Checkout() {
    const location = useLocation();
    const navigate = useNavigate();

    // items coming from Cart: navigate("/checkout", { state: { items } })
    const itemsFromCart = location.state?.items || [];

    // Is there any prescribed medication in this order?
    const hasPrescribed = itemsFromCart.some((item) => item.prescribed);

    // Dynamic tabs (Prescription appears only if needed)
    const checkoutTabs = [
        { key: "summary", label: "Order Summary" },
        ...(hasPrescribed
            ? [{ key: "prescription", label: "Prescription" }]
            : []),
        { key: "shipping", label: "Shipping" },
        { key: "payment", label: "Payment" },
    ];

    const [activeStep, setActiveStep] = useState("summary");

    // ----- PRESCRIPTION STATE -----
    const [prescriptionState, setPrescriptionState] = useState({
        allValid: !hasPrescribed, // if no prescribed items, it's automatically valid
        anyNewUpload: false,
    });

    const [prescriptionShowErrors, setPrescriptionShowErrors] = useState(false);

    // Dialog when at least one prescription was uploaded as NEW
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);

    // ----- SHIPPING STATE -----
    const [shippingState, setShippingState] = useState({
        isValid: false,
        mode: "pickup",   // "pickup" | "delivery"
        isUrgent: false,
    });

    const [shippingShowErrors, setShippingShowErrors] = useState(false);

    const stepKeys = checkoutTabs.map((t) => t.key);
    const currentIndex = stepKeys.indexOf(activeStep);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === stepKeys.length - 1;

    const isPrescriptionStep = activeStep === "prescription";
    const isShippingStep = activeStep === "shipping";

    const goNextStep = () => {
        if (!isLast) {
            setActiveStep(stepKeys[currentIndex + 1]);
        } else {
            // later: submit final order here
            console.log("Place order clicked");
        }
    };

    const goPrev = () => {
        if (!isFirst) {
            // reset error visibility when going back from prescription or shipping
            if (isPrescriptionStep) {
                setPrescriptionShowErrors(false);
            }
            if (isShippingStep) {
                setShippingShowErrors(false);
            }

            setActiveStep(stepKeys[currentIndex - 1]);
        }
    };

    const handleContinueClick = () => {
        // 1) Prescription step validation
        if (isPrescriptionStep) {
            if (!prescriptionState.allValid) {
                setPrescriptionShowErrors(true);
                return;
            }

            // All info filled:
            if (prescriptionState.anyNewUpload) {
                
                setShowApprovalDialog(true);
            } else {
                
                setPrescriptionShowErrors(false);
                goNextStep();
            }
            return;
        }

        // 2) Shipping step validation
        if (isShippingStep) {
            if (!shippingState.isValid) {
                // tell ShippingTab to show its errors
                setShippingShowErrors(true);
                return;
            }

            // shipping is valid
            setShippingShowErrors(false);
            goNextStep();
            return;
        }

        // 3) Other steps (summary, payment)
        goNextStep();
    };

    const renderActiveTabContent = () => {
        switch (activeStep) {
            case "summary":
                return <OrderSummaryTab items={itemsFromCart} />;

            case "prescription":
                return (
                    <CheckoutPrescriptionTab
                        items={itemsFromCart}
                        showErrors={prescriptionShowErrors}
                        onStateChange={(next) =>
                            setPrescriptionState((prev) =>
                                prev.allValid === next.allValid &&
                                    prev.anyNewUpload === next.anyNewUpload
                                    ? prev 
                                    : next
                            )
                        }
                    />
                );

            case "shipping":
                return (
                    <ShippingTab
                        showErrors={shippingShowErrors}
                        onStateChange={(next) =>
                            setShippingState((prev) =>
                                prev.isValid === next.isValid &&
                                    prev.mode === next.mode &&
                                    prev.isUrgent === next.isUrgent
                                    ? prev
                                    : next
                            )
                        }
                    />
                );

            case "payment":
                return (
                    <PaymentTab
                        items={itemsFromCart}
                        shippingMode={shippingState.mode}
                        isUrgent={shippingState.isUrgent}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <>
            <PageHeader title="Checkout" />

            <div className="container pt-4 pb-5 checkout-page">
                {/* Tabs header (locked – navigation only via buttons) */}
                <NavigationTab
                    tabs={checkoutTabs}
                    activeTab={activeStep}
                    onTabChange={setActiveStep}
                    locked={true}
                />

                <div className="border rounded-bottom p-4 mt-0 text-center">
                    {renderActiveTabContent()}

                    {/* Bottom navigation buttons */}
                    <div className="d-flex justify-content-between mt-4">
                        {isFirst ? (
                            <span />
                        ) : (
                            <button
                                type="button"
                                className="btn btn-outline-secondary px-4"
                                onClick={goPrev}
                            >
                                Previous
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn qp-add-btn px-4"
                            onClick={handleContinueClick}
                        >
                            {isLast ? "Place Order" : "Continue"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Dialog when prescriptions are sent for approval */}
            <DialogModal
                show={showApprovalDialog}
                title="Prescription Sent for Approval"
                body={
                    <>
                        <p className="fw-bold">
                            Your prescription has been sent for approval.
                        </p>
                        <p>
                            This might take a while. Please wait for the
                            approval email. Once approved, you can continue
                            your order from the My Orders page.
                        </p>
                    </>
                }
                confirmLabel="Go to My Order"
                cancelLabel="Stay on Checkout"
                onCancel={() => setShowApprovalDialog(false)}
                onConfirm={() => {
                    setShowApprovalDialog(false);
                    // TODO: replace with actual order details route + orderId
                    navigate("/myOrders");
                }}
            />
        </>
    );
}
