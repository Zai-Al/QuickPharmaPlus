// src/Pages/External_System/MyOrderDetails.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import SuccessAlert from "../Shared_Components/SuccessAlert";
import DialogModal from "../Shared_Components/DialogModal";
import { StatusBadge } from "../Shared_Components/statusUI";
import { AuthContext } from "../../../Context/AuthContext";
import "../Shared_Components/External_Style.css";
import logo from "../../../assets/Logo.png";

const hhmm = (t) => {
    if (!t) return "";
    const parts = String(t).split(":");
    if (parts.length >= 2)
        return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
    return String(t);
};

const toISODateLocal = (dt) => {
    if (!dt) return "";
    // If backend already sends "YYYY-MM-DD", keep it as-is
    if (typeof dt === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dt)) return dt;

    const d = new Date(dt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

export default function MyOrderDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const orderId = id;

    const { user } = useContext(AuthContext);
    const userId = user?.userId || user?.id;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    // ================= RESCHEDULE =================
    const [showReschedule, setShowReschedule] = useState(false);
    const [resDates, setResDates] = useState([]); // [{ value: "YYYY-MM-DD", label, slots: [] }]
    const [resDate, setResDate] = useState("");
    const [resSlots, setResSlots] = useState([]); // slots for selected date
    const [resSlotId, setResSlotId] = useState("");
    const [resLoading, setResLoading] = useState(false);
    const [resErr, setResErr] = useState("");

    const canReschedule =
        order?.orderStatusId === 1 &&
        order?.isDelivery === true &&
        order?.isUrgent !== true;

    const labelDate = (iso) => {
        const d = new Date(iso + "T00:00:00");
        return d.toLocaleDateString("en-GB", {
            weekday: "short",
            day: "2-digit",
            month: "short",
        });
    };

    const openReschedule = async () => {
        setShowReschedule(true);
        setResLoading(true);
        setResErr("");
        setResDates([]);
        setResSlots([]);
        setResSlotId("");
        setResDate("");

        try {
            const url = `${API_BASE}/api/MyOrders/${encodeURIComponent(
                orderId
            )}/reschedule-options?userId=${encodeURIComponent(userId)}`;

            const res = await fetch(url, { credentials: "include" });
            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || "Failed to load available dates/slots.");
            }

            const json = await res.json();
            const days = Array.isArray(json?.days) ? json.days : [];

            const mapped = days
                .map((d) => {
                    const iso = typeof d.date === "string" ? d.date : "";
                    return {
                        value: iso,
                        label: iso ? labelDate(iso) : "",
                        slots: Array.isArray(d.slots) ? d.slots : [],
                    };
                })
                .filter((x) => x.value);

            
            setResDates(mapped);

            // prefer the order's current shipping date (if exists and is within allowed list)
            const currentIso = toISODateLocal(order?.shippingDate);

            const match = currentIso ? mapped.find((x) => x.value === currentIso) : null;
            const initial = match || mapped[0] || null;

            if (initial) {
                setResDate(initial.value);
                setResSlots(initial.slots || []);

                
                const currentSlotId = order?.slotId ? String(order.slotId) : "";
                if (
                    currentSlotId &&
                    (initial.slots || []).some((s) => String(s.slotId) === currentSlotId)
                ) {
                    setResSlotId(currentSlotId);
                }
            } else {
                setResErr("No available dates/slots to reschedule.");
            }
        } catch (e) {
            setResErr(e?.message || "Failed to load reschedule options.");
        } finally {
            setResLoading(false);
        }
    };


    const onChangeResDate = (val) => {
        setResDate(val);
        setResSlotId("");

        const found = resDates.find((x) => x.value === val);
        setResSlots(found?.slots || []);
    };

    const closeReschedule = () => {
        setShowReschedule(false);
        setResErr("");
        setResSlotId("");
        setResSlots([]);
        setResDate("");
        setResDates([]);
        setResLoading(false);
    };

    const submitReschedule = async () => {
        if (!resDate) {
            setResErr("Please select a date.");
            return;
        }
        if (!resSlotId) {
            setResErr("Please select a time slot.");
            return;
        }

        setResLoading(true);
        setResErr("");

        try {
            const res = await fetch(
                `${API_BASE}/api/MyOrders/${encodeURIComponent(orderId)}/reschedule`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        userId: Number(userId),
                        shippingDate: resDate, // "YYYY-MM-DD"
                        slotId: Number(resSlotId),
                    }),
                }
            );

            if (!res.ok) {
                const t = await res.text().catch(() => "");
                throw new Error(t || "Unable to reschedule. Please try another slot.");
            }

            setSuccessMsg("Delivery rescheduled successfully.");
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1200);

            closeReschedule();

            // refresh order details
            const url = `${API_BASE}/api/MyOrders/${encodeURIComponent(
                orderId
            )}?userId=${encodeURIComponent(userId)}`;

            const refreshed = await fetch(url, { credentials: "include" });
            if (refreshed.ok) {
                const json = await refreshed.json();
                setOrder(json);
            }
        } catch (e) {
            setResErr(e?.message || "Reschedule failed.");
        } finally {
            setResLoading(false);
        }
    };

    // ================= LOAD ORDER =================
    useEffect(() => {
        if (!userId || !orderId) return;

        const run = async () => {
            setLoading(true);
            setErr("");

            try {
                const url = `${API_BASE}/api/MyOrders/${encodeURIComponent(
                    orderId
                )}?userId=${encodeURIComponent(userId)}`;

                const res = await fetch(url, { credentials: "include" });
                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load order (${res.status})`);
                }

                const json = await res.json();
                setOrder(json);
            } catch (e) {
                setErr(e?.message || "Failed to load order details.");
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [API_BASE, userId, orderId]);

    const isDelivery = !!order?.isDelivery;

    const orderDateLabel = useMemo(() => {
        if (!order?.orderCreationDate) return "-";
        return new Date(order.orderCreationDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    }, [order]);

    const shippingDateLabel = useMemo(() => {
        if (!order?.shippingDate) return "-";
        return new Date(order.shippingDate).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    }, [order]);

    const slotLabel = useMemo(() => {
        if (!isDelivery) return "-";

        if (order?.isUrgent) return "Delivery within an hour";

        const start = hhmm(order?.slotStart);
        const end = hhmm(order?.slotEnd);

        if (start && end) return `${start} - ${end}`;

        return order?.slotName ? String(order.slotName) : "-";
    }, [order, isDelivery]);

    const handleDownload = () => {
        setSuccessMsg("Preparing download...");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1200);
        window.print();
    };

    const mappedItemsForTable = useMemo(() => {
        return (order?.items || []).map((it, idx) => ({
            id: idx + 1,
            name: it.productName,

            // keep your existing display (category + type)
            category: `${it.categoryName || ""}${it.productTypeName ? `, ${it.productTypeName}` : ""
                }`,

            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),

            imageSrc: it.image ? `data:image/jpeg;base64,${it.image}` : "",

            prescribed: !!it.isPrescribed,
            incompatibilities: it.incompatibilities || {},
        }));
    }, [order]);

    const subtotal = useMemo(() => {
        return (order?.items || []).reduce(
            (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
            0
        );
    }, [order]);

    // You said this works for you (true => 1 BHD). Keeping it.
    const deliveryFee = Number(order?.isDelivery || 0);
    const urgentFee = Number(order?.isUrgent || 0);

    const totalAmount = Number(order?.orderTotal ?? subtotal + deliveryFee + urgentFee);

    if (loading) {
        return (
            <div className="min-vh-100">
                <PageHeader title="Order Details" />
                <div className="container list-padding">
                    <div className="alert alert-info py-2">Loading...</div>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-vh-100">
                <PageHeader title="Order Details" />
                <div className="container list-padding">
                    <div className="alert alert-danger py-2">{err}</div>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate("/myOrders")}
                        >
                            Back to Orders
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-vh-100">
            {/* UI ONLY (hidden in print) */}
            <div className="qp-no-print">
                <PageHeader title="Order Details" />
            </div>

            <SuccessAlert
                show={showSuccess}
                message={successMsg}
                onClose={() => setShowSuccess(false)}
            />

            {/* ================= RESCHEDULE MODAL ================= */}
            <DialogModal
                show={showReschedule}
                title="Reschedule Delivery"
                body={
                    <>
                        {resErr && <div className="alert alert-danger py-2">{resErr}</div>}

                        <div className="mb-3 text-start">
                            <label className="form-label fw-semibold">Date</label>
                            <select
                                className="form-select"
                                value={resDate}
                                disabled={resLoading || resDates.length === 0}
                                onChange={(e) => onChangeResDate(e.target.value)}
                            >
                                {resDates.length === 0 ? (
                                    <option value="">No dates available</option>
                                ) : (
                                    resDates.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <div className="mb-2 text-start">
                            <label className="form-label fw-semibold">Time</label>
                            <select
                                className="form-select"
                                value={resSlotId}
                                disabled={resLoading || !resDate || resSlots.length === 0}
                                onChange={(e) => setResSlotId(e.target.value)}
                            >
                                <option value="">Select a time slot</option>
                                {resSlots.map((s) => (
                                    <option key={s.slotId} value={String(s.slotId)}>
                                        {`${hhmm(s.start)} - ${hhmm(s.end)}`}
                                    </option>
                                ))}
                            </select>

                            {!resLoading && resDate && resSlots.length === 0 && (
                                <div className="text-danger small mt-2">
                                    No available slots for this day.
                                </div>
                            )}
                        </div>
                    </>
                }
                confirmLabel={resLoading ? "Saving..." : "Confirm"}
                cancelLabel="Cancel"
                onCancel={closeReschedule}
                onConfirm={submitReschedule}
            />


            <div className="container list-padding">
                {/* ================= PRINT HEADER (PRINT ONLY) ================= */}
                <div className="qp-print-only qp-print-header">
                    <div className="qp-print-header-top">
                        <img src={logo} alt="QuickPharma+" className="qp-print-logo" />
                    </div>

                    <div className="qp-print-header-bottom">
                        <div className="qp-print-title">Order Receipt</div>
                    </div>
                </div>

                {/* ================= PRINT CONTENT ================= */}
                <div className="qp-print-area">
                    <div className="d-flex justify-content-between align-items-start order-summary-margin">
                        <div>
                            <p className="mb-2 text-start">
                                <span className="fw-bold">Order ID: </span>
                                {order.orderId}
                            </p>

                            <p className="mb-2 text-start">
                                <span className="fw-bold">Order Date: </span>
                                {orderDateLabel}
                            </p>

                            <p className="mb-2 text-start">
                                <span className="fw-bold">Order Status: </span>
                                <StatusBadge status={order.orderStatusName || ""} />
                            </p>

                            <p className="mb-2 text-start">
                                <span className="fw-bold">Shipping Method: </span>
                                {isDelivery ? "Delivery" : "Pickup"}
                            </p>

                            <p className="mb-2 text-start">
                                <span className="fw-bold">
                                    {isDelivery
                                        ? "Delivery Branch City: "
                                        : "Pickup Branch City: "}
                                </span>
                                {order.branchName || "-"}
                            </p>

                            {isDelivery && (
                                <>
                                    <p className="mb-2 text-start">
                                        <span className="fw-bold">Delivery Date: </span>
                                        {shippingDateLabel}
                                    </p>

                                    <p className="mb-2 text-start">
                                        <span className="fw-bold">Delivery Time: </span>
                                        {slotLabel}
                                    </p>
                                </>
                            )}

                            <p className="mb-2 text-start">
                                <span className="fw-bold">Payment Method: </span>
                                {order.paymentMethodName || "-"}
                            </p>
                        </div>

                        {/* UI buttons – hidden in print */}
                        <div className="d-flex flex-column gap-2 qp-no-print">
                            <button
                                type="button"
                                className="btn btn-sm qp-add-btn"
                                style={{ minWidth: "125px", minHeight:"33px" }}
                                onClick={handleDownload}
                            >
                                Download Order
                            </button>

                            {canReschedule && (
                                <button
                                    type="button"
                                    className="btn btn-sm qp-edit-btn"
                                    style={{ minWidth: "125px", minHeight: "33px" }}
                                    onClick={openReschedule}
                                >
                                    Reschedule
                                </button>
                            )}
                        </div>
                    </div>

                    <OrderItemsTable
                        items={mappedItemsForTable}
                        currency="BHD"
                        title="Order Summary"
                        deliveryFee={deliveryFee}
                        urgentFee={urgentFee}
                        total={totalAmount}
                    />
                </div>

                {/* UI ONLY (hidden in print) */}
                <div className="mt-4 text-center qp-no-print">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate("/myOrders")}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        </div>
    );
}
