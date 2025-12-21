// src/Pages/External_System/MyOrderDetails.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import SuccessAlert from "../Shared_Components/SuccessAlert";
import { StatusBadge } from "../Shared_Components/statusUI";
import { AuthContext } from "../../../Context/AuthContext";
import "../Shared_Components/External_Style.css";

export default function MyOrderDetails() {
    const navigate = useNavigate();
    const { orderId } = useParams();

    const { user } = useContext(AuthContext);
    const userId = user?.userId || user?.id;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

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
        if (order?.slotStart && order?.slotEnd) return `${order.slotStart} - ${order.slotEnd}`;
        return order?.slotName || "-";
    }, [order]);

    const handleDownload = () => {
        setSuccessMsg("Preparing download...");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 900);
        window.print();
    };

    const mappedItemsForTable = useMemo(() => {
        return (order?.items || []).map((it, idx) => ({
            id: idx + 1,
            name: it.productName,
            category: `${it.categoryName || ""}${it.productTypeName ? ` • ${it.productTypeName}` : ""}`,
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),

            // IMPORTANT: Base64 image string from backend
            imageSrc: it.image ? `data:image/jpeg;base64,${it.image}` : "",
        }));
    }, [order]);

    if (loading) {
        return (
            <div className="min-vh-100">
                <PageHeader title="Order Details" />
                <div className="container py-4">
                    <div className="alert alert-info py-2">Loading...</div>
                </div>
            </div>
        );
    }

    if (err) {
        return (
            <div className="min-vh-100">
                <PageHeader title="Order Details" />
                <div className="container py-4">
                    <div className="alert alert-danger py-2">{err}</div>
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => navigate("/myOrders")}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="min-vh-100">
            <PageHeader title="Order Details" />

            <SuccessAlert
                show={showSuccess}
                message={successMsg}
                onClose={() => setShowSuccess(false)}
            />

            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                    <div>
                        <p className="mb-1 text-start">
                            <span className="fw-bold">Order ID: </span>
                            {order.orderId}
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">Order Date: </span>
                            {orderDateLabel}
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">Order Status: </span>
                            <StatusBadge status={order.orderStatusName || ""} />
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">Shipping Method: </span>
                            {isDelivery ? "Delivery" : "Pickup"}
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">{isDelivery ? "Delivery Branch City: " : "Pickup Branch City: "}</span>
                            {order.branchName || "-"}
                        </p>

                        {isDelivery && (
                            <>
                                <p className="mb-1 text-start">
                                    <span className="fw-bold">Delivery Date: </span>
                                    {shippingDateLabel}
                                </p>

                                <p className="mb-1 text-start">
                                    <span className="fw-bold">Delivery Time: </span>
                                    {slotLabel}
                                </p>
                            </>
                        )}

                        <p className="mb-0 text-start">
                            <span className="fw-bold">Payment Method: </span>
                            {order.paymentMethodName || "-"}
                        </p>
                    </div>

                    <div className="d-flex flex-column gap-2">
                        <button
                            type="button"
                            className="btn btn-sm qp-add-btn"
                            style={{ minWidth: 170 }}
                            onClick={handleDownload}
                        >
                            Download Order
                        </button>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            style={{ minWidth: 170 }}
                            onClick={() => navigate("/myOrders")}
                        >
                            Back to Orders
                        </button>
                    </div>
                </div>

                <OrderItemsTable
                    items={mappedItemsForTable}
                    currency="BHD"
                    shippingMethod={isDelivery ? "Delivery" : "Pickup"}
                    title="Order Summary"
                />
            </div>
        </div>
    );
}
