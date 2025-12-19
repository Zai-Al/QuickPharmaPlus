// src/Pages/External_System/Checkout.jsx
import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../Context/AuthContext.jsx";

import PageHeader from "../Shared_Components/PageHeader";
import NavigationTab from "../Shared_Components/NavigationTab";
import DialogModal from "../Shared_Components/DialogModal";

import OrderSummaryTab from "./OrderSummaryTab";
import CheckoutPrescriptionTab from "./CheckoutPrescriptionTab";
import ShippingTab from "./ShippingTab";
import PaymentTab from "./PaymentTab";

import "../Shared_Components/External_Style.css";

export default function Checkout() {
    const navigate = useNavigate();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const userId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const [itemsFromCart, setItemsFromCart] = useState([]);
    const [loadingCart, setLoadingCart] = useState(false);
    const [cartError, setCartError] = useState("");

    const [showMismatchDialog, setShowMismatchDialog] = useState(false);
    const [mismatchDialogBody, setMismatchDialogBody] = useState(null);

    const validateApprovedPrescriptionsBeforeContinue = async () => {
        const sections = prescriptionState.sections || {};
        const prescribed = (itemsFromCart || []).filter((x) => x.prescribed);

        for (const item of prescribed) {
            const sec = sections[item.id];
            if (!sec) continue;

            // only validate existing/code flows (new uploads handled by your upload flow)
            if (sec.mode === "existing" || sec.mode === "code") {
                // must have passed backend check in the section
                if (!sec.backendChecked || !sec.backendValid) {
                    setMismatchDialogBody(
                        <>
                            <p className="fw-bold mb-2">Prescription validation failed</p>
                            <p className="mb-1">
                                Item: <span className="fw-bold">{item.name}</span>
                            </p>
                            <p className="mb-0">
                                {sec.backendMessage || "Prescription does not match the prescribed product/quantity."}
                            </p>
                        </>
                    );
                    setShowMismatchDialog(true);
                    return false;
                }
            }
        }

        return true;
    };


    // ? prevents “empty cart” warning flashing before first fetch finishes
    const [cartLoadedOnce, setCartLoadedOnce] = useState(false);

    // Is there any prescribed medication in this order?
    const hasPrescribed = itemsFromCart.some((item) => item.prescribed);

    // Dynamic tabs (Prescription appears only if needed)
    const checkoutTabs = [
        { key: "summary", label: "Order Summary" },
        ...(hasPrescribed ? [{ key: "prescription", label: "Prescription" }] : []),
        { key: "shipping", label: "Shipping" },
        { key: "payment", label: "Payment" },
    ];

    const [activeStep, setActiveStep] = useState("summary");

    // ----- PRESCRIPTION STATE -----
    const [prescriptionState, setPrescriptionState] = useState({
        allValid: !hasPrescribed,
        anyNewUpload: false,
        sections: {}, // per-item section payloads from CheckoutPrescriptionTab
    });

    const [prescriptionUploading, setPrescriptionUploading] = useState(false);
    const [prescriptionUploadError, setPrescriptionUploadError] = useState("");
    const [prescriptionShowErrors, setPrescriptionShowErrors] = useState(false);

    // Dialog when at least one prescription was uploaded as NEW
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);

    // ----- SHIPPING STATE -----
    const [shippingState, setShippingState] = useState({
        isValid: false,
        mode: "pickup", // "pickup" | "delivery"
        isUrgent: false,
    });

    const [shippingShowErrors, setShippingShowErrors] = useState(false);

    const handlePrescriptionStateChange = useCallback((next) => {
        setPrescriptionState((prev) => {
            const same =
                prev.allValid === next.allValid &&
                prev.anyNewUpload === next.anyNewUpload &&
                prev.sections === next.sections; // reference compare is fine

            return same ? prev : next;
        });
    }, []);

    const handleShippingStateChange = useCallback((next) => {
        setShippingState((prev) =>
            prev.isValid === next.isValid &&
                prev.mode === next.mode &&
                prev.isUrgent === next.isUrgent
                ? prev
                : next
        );
    }, []);

    // ? keep prescription defaults in sync if cart changes and prescription tab is removed/added
    useEffect(() => {
        setPrescriptionState((prev) => ({
            ...prev,
            allValid: hasPrescribed ? prev.allValid : true,
        }));
    }, [hasPrescribed]);

    useEffect(() => {
        if (!userId) {
            setItemsFromCart([]);
            setCartLoadedOnce(true);
            return;
        }

        const controller = new AbortController();

        const fetchCart = async () => {
            try {
                setLoadingCart(true);
                setCartError("");

                const res = await fetch(`${API_BASE}/api/Cart?userId=${userId}`, {
                    signal: controller.signal,
                    headers: { "Content-Type": "application/json" },
                });

                if (!res.ok) throw new Error("Failed to load cart for checkout.");

                const data = await res.json();
                const apiItems = Array.isArray(data?.items) ? data.items : [];

                // normalize to what checkout expects (id/quantity/prescribed)
                const mapped = apiItems
                    .map((x, idx) => {
                        const productId = x.productId ?? x.ProductId;
                        const qty = x.cartQuantity ?? x.CartQuantity ?? 1;

                        return {
                            ...x,
                            id: productId ?? idx + 1,
                            productId,
                            name: x.name ?? x.Name ?? "—",
                            price: x.price ?? x.Price ?? 0,
                            quantity: Number(qty) || 1,
                            prescribed: !!(x.requiresPrescription ?? x.RequiresPrescription ?? false),
                            stockStatus: x.stockStatus ?? x.StockStatus ?? "IN_STOCK",
                            inventoryCount: x.inventoryCount ?? x.InventoryCount ?? 0,

                            category: x.category ?? x.categoryName ?? x.CategoryName ?? "",
                            type: x.type ?? x.productTypeName ?? x.ProductTypeName ?? "",

                            imageSrc:
                                x.imageSrc ??
                                x.productImageBase64 ??
                                x.ProductImageBase64 ??
                                null,
                            incompatibilities: x.incompatibilities ?? x.Incompatibilities ?? {},
                        };
                    })
                    .filter(
                        (it) =>
                            (it.stockStatus || "").toUpperCase() !== "OUT_OF_STOCK" &&
                            (it.inventoryCount ?? 0) > 0
                    );

                setItemsFromCart(mapped);
            } catch (e) {
                if (e.name !== "AbortError") {
                    setCartError(e?.message || "Error loading cart.");
                    setItemsFromCart([]);
                }
            } finally {
                setLoadingCart(false);
                setCartLoadedOnce(true);
            }
        };

        fetchCart();
        return () => controller.abort();
    }, [API_BASE, userId]);

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
            if (isPrescriptionStep) setPrescriptionShowErrors(false);
            if (isShippingStep) setShippingShowErrors(false);
            setActiveStep(stepKeys[currentIndex - 1]);
        }
    };

    // ? Upload all NEW prescriptions (from prescription tab) before showing approval dialog
    const uploadNewCheckoutPrescriptions = async () => {
        if (!userId) throw new Error("Missing userId.");

        const sections = prescriptionState.sections || {};
        const newUploads = Object.values(sections).filter((s) => s?.mode === "new");

        if (!newUploads.length) return;

        setPrescriptionUploading(true);
        setPrescriptionUploadError("");

        try {
            for (const s of newUploads) {
                // Basic guard (should already be enforced by allValid, but keep it safe)
                if (!s?.prescriptionFile || !s?.cprFile) {
                    throw new Error("Missing prescription file(s).");
                }

                const fd = new FormData();

                // MUST match backend DTO property names:
                fd.append("PrescriptionDocument", s.prescriptionFile);
                fd.append("PrescriptionCprDocument", s.cprFile);

                // you said you don’t want name for checkout prescriptions
                fd.append("PrescriptionName", "");

                // Address payload from PrescriptionItemSection
                const cityId = Number.parseInt(s.address?.cityId, 10);
                fd.append("CityId", Number.isFinite(cityId) ? String(cityId) : "");
                fd.append("Block", s.address?.block ?? "");
                fd.append("Road", s.address?.road ?? "");
                fd.append("BuildingFloor", s.address?.buildingFloor ?? "");

                const res = await fetch(`${API_BASE}/api/Prescription/checkout/${userId}`, {
                    method: "POST",
                    body: fd,
                });

                if (!res.ok) {
                    let msg = `Upload failed (${res.status})`;
                    try {
                        const j = await res.json();
                        msg = j?.error || j?.message || msg;
                    } catch {
                        // ignore JSON parsing errors
                    }
                    throw new Error(msg);
                }
            }
        } finally {
            setPrescriptionUploading(false);
        }
    };

    const canContinue =
        // don’t allow continue if cart not ready / empty
        cartLoadedOnce &&
        !loadingCart &&
        !cartError &&
        itemsFromCart.length > 0 &&
        // per-step validation
        (isPrescriptionStep
            ? prescriptionState.allValid
            : isShippingStep
                ? shippingState.isValid
                : true);


    const handleContinueClick = () => {
        // 1) Prescription step validation + upload
        if (isPrescriptionStep) {
            setPrescriptionUploadError("");

            if (!prescriptionState.allValid) {
                setPrescriptionShowErrors(true);
                return;
            }

            // All info filled:
            if (prescriptionState.anyNewUpload) {
                setPrescriptionShowErrors(false);

                (async () => {
                    try {
                        await uploadNewCheckoutPrescriptions();
                        setShowApprovalDialog(true);
                    } catch (e) {
                        setPrescriptionUploadError(
                            e?.message || "Failed to upload prescription."
                        );
                    }
                })();

                return;
            }
        } else {
            // ? existing/code path must be validated by backend before continue
            (async () => {
                const ok = await validateApprovedPrescriptionsBeforeContinue();
                if (!ok) {
                    setPrescriptionShowErrors(true);
                    return;
                }

                setPrescriptionShowErrors(false);
                goNextStep();
            })();

            return;
        }


        // 2) Shipping step validation
        if (isShippingStep) {
            if (!shippingState.isValid) {
                setShippingShowErrors(true);
                return;
            }

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
                        userId={userId}
                        showErrors={prescriptionShowErrors}
                        onStateChange={handlePrescriptionStateChange}
                    />
                );

            case "shipping":
                return (
                    <ShippingTab
                        userId={userId}
                        cartItems={itemsFromCart}
                        showErrors={shippingShowErrors}
                        onStateChange={handleShippingStateChange}
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
                <NavigationTab
                    tabs={checkoutTabs}
                    activeTab={activeStep}
                    onTabChange={setActiveStep}
                    locked={true}
                />

                <div className="border rounded-bottom p-4 mt-0 text-center">
                    {loadingCart && (
                        <div className="alert alert-info">Loading your cart...</div>
                    )}
                    {cartError && <div className="alert alert-danger">{cartError}</div>}

                    {cartLoadedOnce &&
                        !loadingCart &&
                        !cartError &&
                        itemsFromCart.length === 0 && (
                            <div className="alert alert-warning">
                                Your cart has no in-stock items to checkout.
                            </div>
                        )}

                    {/* ? show upload errors on prescription step */}
                    {activeStep === "prescription" && prescriptionUploadError && (
                        <div className="alert alert-danger">{prescriptionUploadError}</div>
                    )}

                    {renderActiveTabContent()}

                    <div className="d-flex justify-content-between mt-4">
                        {isFirst ? (
                            <span />
                        ) : (
                            <button
                                type="button"
                                className="btn btn-outline-secondary px-4"
                                onClick={goPrev}
                                disabled={prescriptionUploading}
                            >
                                Previous
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn qp-add-btn px-4"
                            onClick={handleContinueClick}
                            disabled={prescriptionUploading || !canContinue}
                        >
                            {prescriptionUploading
                                ? "Uploading..."
                                : isLast
                                    ? "Place Order"
                                    : "Continue"}
                        </button>
                    </div>
                </div>
            </div>

            <DialogModal
                show={showApprovalDialog}
                title="Prescription Sent for Approval"
                body={
                    <>
                        <p className="fw-bold">Your prescription has been sent for approval.</p>
                        <p>
                            This might take a while. Please wait for the approval email. Once
                            approved, you can continue your order from the My Orders page.
                        </p>
                    </>
                }
                confirmLabel="Go to My Order"
                cancelLabel="Stay on Checkout"
                onCancel={() => setShowApprovalDialog(false)}
                onConfirm={() => {
                    setShowApprovalDialog(false);
                    navigate("/myOrders");
                }}
            />
            <DialogModal
                show={showMismatchDialog}
                title="Prescription does not match"
                body={mismatchDialogBody}
                confirmLabel="OK"
                cancelLabel={null}
                onCancel={() => setShowMismatchDialog(false)}
                onConfirm={() => setShowMismatchDialog(false)}
            />

        </>
    );
}
