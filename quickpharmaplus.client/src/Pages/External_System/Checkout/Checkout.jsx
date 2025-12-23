// src/Pages/External_System/Checkout.jsx
import { useEffect, useState, useContext, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../../../Context/AuthContext.jsx";
import { CartContext } from "../../../Context/CartContext.jsx";

import PageHeader from "../Shared_Components/PageHeader";
import NavigationTab from "../Shared_Components/NavigationTab";
import DialogModal from "../Shared_Components/DialogModal";

import OrderSummaryTab from "./OrderSummaryTab";
import CheckoutPrescriptionTab from "./CheckoutPrescriptionTab";
import ShippingTab from "./ShippingTab";
import PaymentTab from "./PaymentTab";

import "../Shared_Components/External_Style.css";

const DRAFT_KEY = "qp_checkout_draft_v1";

function saveDraftToSession(draft) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

function loadDraftFromSession() {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}
function clearDraftFromSession() {
    sessionStorage.removeItem(DRAFT_KEY);
}

// ---- helpers ----
function pickSingleApprovedPrescriptionId(prescriptionState, itemsFromCart) {
    const sections = prescriptionState?.sections || {};
    const prescribed = (itemsFromCart || []).filter((x) => x.prescribed);

    const ids = new Set();

    for (const item of prescribed) {
        const sec = sections[item.id];
        if (!sec) continue;

        // existing mode (health profile)
        if (sec.mode === "existing") {
            const v = Number(sec.selectedExisting ?? sec.selectedPrescriptionId);
            if (Number.isFinite(v) && v > 0) ids.add(v);
        }

        // code mode
        if (sec.mode === "code") {
            const v = Number(sec.approvedPrescriptionId ?? sec.approvalCode ?? sec.selectedExisting);
            if (Number.isFinite(v) && v > 0) ids.add(v);
        }
    }

    if (ids.size === 1) return [...ids][0];
    return null;
}

// helper image
const buildCartImageSrc = (x, API_BASE) => {
    const productId = x?.productId ?? x?.ProductId ?? null;

    const base64 =
        x?.productImageBase64 ??
        x?.ProductImageBase64 ??
        x?.imageBase64 ??
        x?.ImageBase64 ??
        null;

    const hasBase64 = !!base64;

    return hasBase64
        ? `data:image/jpeg;base64,${base64}`
        : productId
            ? `${API_BASE}/api/ExternalProducts/${productId}/image?v=${productId}`
            : "";
};

export default function Checkout() {
    const navigate = useNavigate();
    const [sp] = useSearchParams();

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const { user } = useContext(AuthContext);
    const { refreshCartCount } = useContext(CartContext);
    const userId = user?.userId ?? user?.id ?? user?.UserId ?? null;

    const [itemsFromCart, setItemsFromCart] = useState([]);
    const [loadingCart, setLoadingCart] = useState(false);
    const [cartError, setCartError] = useState("");

    const [showMismatchDialog, setShowMismatchDialog] = useState(false);
    const [mismatchDialogBody, setMismatchDialogBody] = useState(null);
    const [createdOrderId, setCreatedOrderId] = useState(null);


    // If we ever go to Stripe and come back, we want to restore this.
    const [draft, setDraft] = useState(() => {
        const fromSession = loadDraftFromSession();
        return (
            fromSession || {
                shipping: null, // full ShippingTab payload
                prescription: null, // { ApprovedPrescriptionId, IsHealthProfile }
                payment: { method: "cash" },
            }
        );
    });

    useEffect(() => {
        saveDraftToSession(draft);
    }, [draft]);

    // Tracks whether we intentionally left to Stripe.
    const leavingForStripeRef = useRef(false);

    // Prevent session draft hanging around if user leaves checkout normally.
    useEffect(() => {
        return () => {
            if (!leavingForStripeRef.current) {
                clearDraftFromSession();
            }
        };
    }, []);

    // Prevent “empty cart” warning flashing before first fetch finishes
    const [cartLoadedOnce, setCartLoadedOnce] = useState(false);

    // fetch cart
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
                    credentials: "include",
                });

                if (!res.ok) throw new Error("Failed to load cart for checkout.");

                const data = await res.json();
                const apiItems = Array.isArray(data?.items) ? data.items : [];

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

                            imageSrc: buildCartImageSrc(x, API_BASE),
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

    // Is there any prescribed medication in this order?
    const hasPrescribed = itemsFromCart.some((item) => item.prescribed);

    // Dynamic tabs (Prescription appears only if needed)
    const checkoutTabs = useMemo(
        () => [
            { key: "summary", label: "Order Summary" },
            ...(hasPrescribed ? [{ key: "prescription", label: "Prescription" }] : []),
            { key: "shipping", label: "Shipping" },
            { key: "payment", label: "Payment" },
        ],
        [hasPrescribed]
    );

    const [activeStep, setActiveStep] = useState("summary");

    // Restore tab on return from Stripe cancel:
    useEffect(() => {
        const tab = sp.get("tab");
        if (tab && checkoutTabs.some((t) => t.key === tab)) {
            setActiveStep(tab);
        }
        const fromSession = loadDraftFromSession();
        if (fromSession) setDraft(fromSession);
        // eslint-disable-next-line react-hooks/exhaustive-deps

        const pay = sp.get("pay");
        if (pay === "cancel") {
            setPlaceOrderError("Online payment was cancelled. Please try again.");
            setActiveStep("payment");
            leavingForStripeRef.current = false; // important: user came back
        }

    }, []);

    // ----- PRESCRIPTION STATE -----
    const [prescriptionState, setPrescriptionState] = useState({
        allValid: !hasPrescribed,
        anyNewUpload: false,
        sections: {},
    });

    const [prescriptionUploading, setPrescriptionUploading] = useState(false);
    const [prescriptionUploadError, setPrescriptionUploadError] = useState("");
    const [prescriptionShowErrors, setPrescriptionShowErrors] = useState(false);

    // Dialog when at least one prescription was uploaded as NEW
    const [showApprovalDialog, setShowApprovalDialog] = useState(false);

    // ----- SHIPPING STATE -----
    const [shippingState, setShippingState] = useState({
        isValid: false,
        mode: "pickup",
        isUrgent: false,
    });

    const [shippingShowErrors, setShippingShowErrors] = useState(false);

    // ----- PLACE ORDER (CASH) -----
    const [placingOrder, setPlacingOrder] = useState(false);
    const [placeOrderError, setPlaceOrderError] = useState("");
    const [showOrderResultDialog, setShowOrderResultDialog] = useState(false);
    const [orderPlacedOk, setOrderPlacedOk] = useState(false);
    const [orderResultBody, setOrderResultBody] = useState(null);

    // keep prescription defaults in sync if cart changes and prescription tab is removed/added
    useEffect(() => {
        setPrescriptionState((prev) => ({
            ...prev,
            allValid: hasPrescribed ? prev.allValid : true,
        }));
    }, [hasPrescribed]);

    const handlePrescriptionStateChange = useCallback((next) => {
        setPrescriptionState((prev) => {
            const same =
                prev.allValid === next.allValid &&
                prev.anyNewUpload === next.anyNewUpload &&
                prev.sections === next.sections;
            return same ? prev : next;
        });

        // persist so going back restores selections
        setDraft((p) => ({
            ...p,
            prescriptionUI: next, // store the whole UI payload (sections/mode/code/etc)
        }));
    }, []);


    const handleShippingStateChange = useCallback((next) => {
        setShippingState((prev) =>
            prev.isValid === next.isValid &&
                prev.mode === next.mode &&
                prev.isUrgent === next.isUrgent
                ? prev
                : next
        );

        // store full payload for place order
        setDraft((p) => ({
            ...p,
            shipping: next?.payload ? next.payload : next,
        }));
    }, []);

    // --- validate approved prescription sections before leaving prescription step ---
    const validateApprovedPrescriptionsBeforeContinue = useCallback(async () => {
        const sections = prescriptionState.sections || {};
        const prescribed = (itemsFromCart || []).filter((x) => x.prescribed);

        const singleId = pickSingleApprovedPrescriptionId(prescriptionState, itemsFromCart);
        if (prescribed.length > 0 && !prescriptionState.anyNewUpload && !singleId) {
            setMismatchDialogBody(
                <>
                    <p className="fw-bold mb-2">Prescription selection issue</p>
                    <p className="mb-0">
                        Please select the <span className="fw-bold">same approved prescription</span> for
                        all prescribed items.
                    </p>
                </>
            );
            setShowMismatchDialog(true);
            return false;
        }

        for (const item of prescribed) {
            const sec = sections[item.id];
            if (!sec) continue;

            if (sec.mode === "existing" || sec.mode === "code") {
                if (!sec.backendChecked || !sec.backendValid) {
                    setMismatchDialogBody(
                        <>
                            <p className="fw-bold mb-2">Prescription validation failed</p>
                            <p className="mb-1">
                                Item: <span className="fw-bold">{item.name}</span>
                            </p>
                            <p className="mb-0">
                                {sec.backendMessage ||
                                    "Prescription does not match the prescribed product/quantity."}
                            </p>
                        </>
                    );
                    setShowMismatchDialog(true);
                    return false;
                }
            }
        }

        // Save minimal prescription draft (IDs only) for final create
        if (prescribed.length > 0 && !prescriptionState.anyNewUpload) {
            setDraft((p) => ({
                ...p,
                prescription: {
                    ApprovedPrescriptionId: singleId,
                    IsHealthProfile: Object.values(sections).some((s) => s?.mode === "existing"),
                },
            }));
        }

        return true;
    }, [prescriptionState, itemsFromCart]);

    // Upload NEW prescriptions (kept for your old flow; if you no longer need uploads, you can delete this block)
    const uploadNewCheckoutPrescriptions = async () => {
        if (!userId) throw new Error("Missing userId.");

        const sections = prescriptionState.sections || {};
        const newUploads = Object.values(sections).filter((s) => s?.mode === "new");
        if (!newUploads.length) return;

        setPrescriptionUploading(true);
        setPrescriptionUploadError("");

        try {
            for (const s of newUploads) {
                if (!s?.prescriptionFile || !s?.cprFile) {
                    throw new Error("Missing prescription file(s).");
                }

                const fd = new FormData();
                fd.append("PrescriptionDocument", s.prescriptionFile);
                fd.append("PrescriptionCprDocument", s.cprFile);
                fd.append("PrescriptionName", "");

                const cityId = Number.parseInt(s.address?.cityId, 10);
                fd.append("CityId", Number.isFinite(cityId) ? String(cityId) : "");
                fd.append("Block", s.address?.block ?? "");
                fd.append("Road", s.address?.road ?? "");
                fd.append("BuildingFloor", s.address?.buildingFloor ?? "");

                const res = await fetch(`${API_BASE}/api/Prescription/checkout/${userId}`, {
                    method: "POST",
                    body: fd,
                    credentials: "include",
                });

                if (!res.ok) {
                    let msg = `Upload failed (${res.status})`;
                    try {
                        const j = await res.json();
                        msg = j?.error || j?.message || msg;
                    } catch {
                        // ignore
                    }
                    throw new Error(msg);
                }
            }
        } finally {
            setPrescriptionUploading(false);
        }
    };

    // Cash order submit (NO stripe)
    const placeCashOrder = useCallback(async () => {
        if (!userId) return;

        const ship = draft?.shipping;

        if (!ship?.isValid) {
            setPlaceOrderError("Shipping is not valid. Please re-check the Shipping step.");
            return;
        }

        if ((draft?.payment?.method || "cash") !== "cash") {
            setPlaceOrderError("Stripe is disabled for now. Please select Cash.");
            return;
        }

        setPlacingOrder(true);
        setPlaceOrderError("");
        setOrderPlacedOk(false);

        try {
            const fd = new FormData();

            // required
            fd.append("UserId", String(userId));
            fd.append("Mode", String(ship.Mode ?? ship.mode ?? "pickup"));

            // pickup
            if (ship.PickupBranchId != null) fd.append("PickupBranchId", String(ship.PickupBranchId));

            // delivery fields
            fd.append("UseSavedAddress", String(!!ship.UseSavedAddress));
            if (ship.CityId != null) fd.append("CityId", String(ship.CityId));
            if (ship.Block != null) fd.append("Block", String(ship.Block));
            if (ship.Road != null) fd.append("Road", String(ship.Road));
            if (ship.BuildingFloor != null) fd.append("BuildingFloor", String(ship.BuildingFloor));

            // schedule
            fd.append("IsUrgent", String(!!ship.isUrgent || !!ship.IsUrgent));
            if (ship.ShippingDate) fd.append("ShippingDate", String(ship.ShippingDate));
            if (ship.SlotId != null) fd.append("SlotId", String(ship.SlotId));

            // prescription (only if exists)
            if (draft?.prescription?.ApprovedPrescriptionId != null) {
                fd.append("ApprovedPrescriptionId", String(draft.prescription.ApprovedPrescriptionId));
                fd.append("IsHealthProfile", String(!!draft.prescription.IsHealthProfile));
            }

            // not uploading new prescription in this flow
            fd.append("UploadNewPrescription", "false");

            const res = await fetch(`${API_BASE}/api/CheckoutOrder/create`, {
                method: "POST",
                body: fd,
                credentials: "include",
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || !json?.created) {
                const msg = json?.message || `Failed to create order (${res.status}).`;
                const unavailable = Array.isArray(json?.unavailableProductNames)
                    ? json.unavailableProductNames
                    : [];
                const presReason = json?.prescriptionReason;

                setOrderPlacedOk(false);
                setOrderResultBody(
                    <div className="text-start">
                        <div className="fw-bold mb-2">{msg}</div>

                        {presReason && (
                            <div className="mb-2">
                                <div className="fw-bold">Prescription reason:</div>
                                <div>{presReason}</div>
                            </div>
                        )}

                        {unavailable.length > 0 && (
                            <>
                                <div className="fw-bold mt-2">Unavailable items:</div>
                                <ul className="mb-0">
                                    {unavailable.map((n, i) => (
                                        <li key={i}>{n}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                );

                setShowOrderResultDialog(true);
                return;
            }

            // success
            clearDraftFromSession();
            setItemsFromCart([]);
            refreshCartCount?.();

            const oid = json?.orderId ?? null;

            setCreatedOrderId(oid);
            setOrderPlacedOk(true);
            setOrderResultBody(
                <div className="text-start">
                    <div className="fw-bold mb-2">Order placed successfully.</div>
                </div>
            );
            setShowOrderResultDialog(true);

        } catch (e) {
            setPlaceOrderError(e?.message || "Unexpected error while placing order.");
        } finally {
            setPlacingOrder(false);
        }
    }, [API_BASE, draft, userId]);

    const stepKeys = checkoutTabs.map((t) => t.key);
    const currentIndex = stepKeys.indexOf(activeStep);
    const isFirst = currentIndex === 0;
    const isLast = currentIndex === stepKeys.length - 1;

    const isPrescriptionStep = activeStep === "prescription";
    const isShippingStep = activeStep === "shipping";

    const goNextStep = () => {
        if (currentIndex < stepKeys.length - 1) {
            setActiveStep(stepKeys[currentIndex + 1]);
        } else {
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

    const canContinue =
        cartLoadedOnce &&
        !loadingCart &&
        !cartError &&
        itemsFromCart.length > 0 &&
        (isPrescriptionStep
            ? prescriptionState.allValid
            : isShippingStep
                ? shippingState.isValid
                : true);

    const handleContinueClick = () => {
        // 1) Prescription step
        if (isPrescriptionStep) {
            setPrescriptionUploadError("");

            if (!prescriptionState.allValid) {
                setPrescriptionShowErrors(true);
                return;
            }

            if (prescriptionState.anyNewUpload) {
                setPrescriptionShowErrors(false);

                (async () => {
                    try {
                        await uploadNewCheckoutPrescriptions();
                        setShowApprovalDialog(true);
                    } catch (e) {
                        setPrescriptionUploadError(e?.message || "Failed to upload prescription.");
                    }
                })();

                return;
            }

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

        // 2) Shipping step
        if (isShippingStep) {
            if (!shippingState.isValid) {
                setShippingShowErrors(true);
                return;
            }

            setShippingShowErrors(false);
            goNextStep();
            return;
        }

        // 3) Payment step (LAST) -> place cash order
        if (activeStep === "payment" && isLast) {
            placeCashOrder();
            return;
        }

        // 4) Other steps
        goNextStep();
    };
    

    const handlePayOnline = useCallback(async () => {
        setPlaceOrderError("");

        // must have valid shipping before paying
        if (!shippingState.isValid) {
            setPlaceOrderError("Shipping is not valid. Please re-check the Shipping step.");
            return;
        }

        // mark that we are leaving intentionally so unmount doesn't clear session
        leavingForStripeRef.current = true;

        // force-save draft right before redirect (extra safety)
        saveDraftToSession({ ...draft, _userId: userId });

        // build Stripe request payload
        const subtotal = (itemsFromCart || []).reduce(
            (sum, it) => sum + (it.price || 0) * (it.quantity || 0),
            0
        );

        const isDelivery = (shippingState.mode || "").toLowerCase() === "delivery";
        const isUrgent = isDelivery && !!shippingState.isUrgent;

        const deliveryFee = isDelivery ? 1 : 0;
        const urgentFee = isUrgent ? 1 : 0;

        const total = subtotal + deliveryFee + urgentFee;

        // IMPORTANT: PascalCase keys to match your C# DTO (CheckoutRequest)
        const body = {
            Items: (itemsFromCart || []).map((it) => ({
                Name: it.name ?? "Item",
                Price: Number(it.price || 0),
                Quantity: Number(it.quantity || 1),
            })),
            DeliveryFee: deliveryFee,
            Subtotal: subtotal,
            Total: total,

            // THIS is what your StripeController checks
            IsUrgent: isUrgent,
        };

        try {
            const res = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(body),
            });

            const json = await res.json().catch(() => ({}));

            if (!res.ok || !json?.url) {
                throw new Error(
                    json?.message || json?.error || `Stripe session failed (${res.status}).`
                );
            }

            window.location.assign(json.url);
        } catch (e) {
            leavingForStripeRef.current = false; // stay in checkout flow
            setPlaceOrderError(e?.message || "Stripe redirect failed.");
        }
    }, [API_BASE, draft, itemsFromCart, shippingState, userId]);



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
                        initialState={draft?.prescriptionUI || null}
                    />
                );

            case "shipping":
                return (
                    <ShippingTab
                        userId={userId}
                        cartItems={itemsFromCart}
                        showErrors={shippingShowErrors}
                        onStateChange={handleShippingStateChange}
                        initialState={draft?.shipping || null}
                    />
                );

            case "payment":
                return (
                    <PaymentTab
                        items={itemsFromCart}
                        shippingMode={shippingState.mode}
                        isUrgent={shippingState.isUrgent}
                        method={draft.payment?.method || "cash"}
                        onMethodChange={(m) =>
                            setDraft((p) => ({
                                ...p,
                                payment: { ...(p.payment || {}), method: m },
                            }))
                        }
                        onPayOnline={handlePayOnline}
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
                    {loadingCart && <div className="alert alert-info">Loading your cart...</div>}
                    {cartError && <div className="alert alert-danger">{cartError}</div>}

                    {cartLoadedOnce && !loadingCart && !cartError && itemsFromCart.length === 0 && (
                        <div className="alert alert-warning">
                            Your cart has no in-stock items to checkout.
                        </div>
                    )}

                    {activeStep === "prescription" && prescriptionUploadError && (
                        <div className="alert alert-danger">{prescriptionUploadError}</div>
                    )}

                    {activeStep === "payment" && placeOrderError && (
                        <div className="alert alert-danger">{placeOrderError}</div>
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
                                disabled={prescriptionUploading || placingOrder}
                            >
                                Previous
                            </button>
                        )}

                        <button
                            type="button"
                            className="btn qp-add-btn px-4"
                            onClick={handleContinueClick}
                            disabled={prescriptionUploading || placingOrder || !canContinue}
                        >
                            {placingOrder
                                ? "Placing..."
                                : prescriptionUploading
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
                            approved, you can continue your checkout process.
                        </p>
                    </>
                }
                confirmLabel="Go to Home"
                cancelLabel="Stay on Checkout"
                onCancel={() => setShowApprovalDialog(false)}
                onConfirm={() => {
                    setShowApprovalDialog(false);
                    navigate("/home");
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

            <DialogModal
                show={showOrderResultDialog}
                title="Checkout"
                body={orderResultBody}
                confirmLabel="OK"
                cancelLabel={null}
                onCancel={() => {
                    setShowOrderResultDialog(false);
                    if (orderPlacedOk && createdOrderId) {
                        navigate(`/myOrderDetails/${createdOrderId}`);
                    }
                }}
                onConfirm={() => {
                    setShowOrderResultDialog(false);
                    if (orderPlacedOk && createdOrderId) {
                        navigate(`/myOrderDetails/${createdOrderId}`);
                    }
                }}
            />

        </>
    );
}

