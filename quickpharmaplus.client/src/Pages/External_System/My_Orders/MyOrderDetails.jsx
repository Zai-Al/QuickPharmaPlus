// src/Pages/External_System/My_Orders/OrderDetails.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import PageHeader from "../Shared_Components/PageHeader";
import OrderItemsTable from "../Shared_Components/OrderItemsTable";
import DialogModal from "../Shared_Components/DialogModal";
import DropDown from "../Shared_Components/DropDown";
import SuccessAlert from "../Shared_Components/SuccessAlert";
import { StatusBadge } from "../Shared_Components/StatusUI"; 

// temporary mock order – later replace with API call using id
const MOCK_ORDER = {
    id: 34343,
    status: "Out for Delivery",
    shippingMethod: "Delivery", // or "pickup"
    deliveryDate: "24 November, 2025",
    deliveryTime: "9-12 AM",
    paymentMethod: "Online payment",
    items: [
        {
            id: 1,
            name: "Product Name",
            category: "Category",
            price: 0,
            quantity: 1,
            imageSrc: "", // or URL
        },
        {
            id: 2,
            name: "Product Name",
            category: "Category",
            price: 0,
            quantity: 1,
            imageSrc: "",
        },
        {
            id: 3,
            name: "Product Name",
            category: "Category",
            price: 0,
            quantity: 1,
            imageSrc: "",
        },
        {
            id: 4,
            name: "Product Name",
            category: "Category",
            price: 0,
            quantity: 1,
            imageSrc: "",
        },
    ],
};

export default function MyOrderDetails() {
    const navigate = useNavigate();
    const { id } = useParams(); // you can use this when you connect to API

    const [order, setOrder] = useState(MOCK_ORDER);

    const handleReschedule = () => {
        setShowRescheduleModal(true);
    };

    const handleCancel = () => {
        setShowCancelModal(true);
    };

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);

    // reschedule form state
    const [newDate, setNewDate] = useState("");
    const [newTime, setNewTime] = useState("");

    const [showSuccess, setShowSuccess] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const isPending = order.status === "Pending Approval";
    const isDelivery = order.shippingMethod === "Delivery";
    const isOutForDelivery = order.status === "Out for Delivery";
    const isCompleted = order.status === "Completed";
    const isCancelled = order.status === "Cancelled";

    const handleConfirmCancel = () => {
        setOrder((prev) => ({
            ...prev,
            status: "Cancelled"
        }));

        setShowCancelModal(false);
        setSuccessMsg("Order has been successfully cancelled.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };


    const handleConfirmReschedule = () => {
        if (!newDate || !newTime) {
            alert("Please select both a date and a time.");
            return;
        }

        // update frontend only
        setOrder((prev) => ({
            ...prev,
            deliveryDate: newDate,
            deliveryTime: newTime,
        }));

        setShowRescheduleModal(false);
        setSuccessMsg("Delivery has been successfully rescheduled.");
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div className="min-vh-100">
            {/* top bar */}
            <PageHeader title="Order Details" />

            <SuccessAlert
                show={showSuccess}
                message={successMsg}
                onClose={() => setShowSuccess(false)}
            />

            <div className="container list-padding">
                {/* top info row */}
                <div className="d-flex justify-content-between align-items-start order-summary-margin">
                    {/* left: order info */}
                    <div>
                        <p className="mb-1 text-start">
                            <span className="fw-bold">Order ID: </span>
                            {order.id}
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">Order Status: </span>
                            <StatusBadge status={order.status} />
                        </p>

                        <p className="mb-1 text-start">
                            <span className="fw-bold">Shipping Method: </span>
                            {order.shippingMethod}
                        </p>

                        {isDelivery && (
                            <>
                                <p className="mb-1 text-start">
                                    <span className="fw-bold">Delivery Date: </span>
                                    {order.deliveryDate}
                                </p>

                                <p className="mb-1 text-start">
                                    <span className="fw-bold">Delivery Time: </span>
                                    {order.deliveryTime}
                                </p>
                            </>
                        )}

                        <p className="mb-0 text-start">
                            <span className="fw-bold">Payment Method: </span>
                            {order.paymentMethod}
                        </p>
                    </div>

                   
                        <div className="d-flex flex-column gap-2">
                            {/* Only show Reschedule if shipping is delivery */}
                        {isDelivery && !isOutForDelivery && !isCompleted && !isCancelled && (
                            <button
                                    type="button"
                                    className="btn btn-sm qp-add-btn"
                                    style={{ minWidth: "130px" }}
                                    onClick={handleReschedule}
                                >
                                    Reschedule
                                </button>
                            )}
                            {isPending && (
                            <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                style={{ minWidth: "130px" }}
                                onClick={handleCancel}
                            >
                                Cancel Order
                            </button>
                        )}
                        </div>
                    
                </div>

                {/* order summary table */}
                <OrderItemsTable
                    items={order.items}
                    currency="BHD"
                    shippingMethod={order.shippingMethod}
                    title="Order Summary"
                />

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

            <DialogModal
                show={showCancelModal}
                title="Cancel Order"
                body="Are you sure you want to cancel this order?"
                confirmLabel="Yes, Cancel"
                cancelLabel="No"
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowCancelModal(false)}
            />

            {/* Reschedule modal */}
            <DialogModal
                show={showRescheduleModal}
                title="Reschedule Delivery"
                body={
                    <div>
                        <p className="mb-3">
                            Select a new delivery date and time:
                        </p>

                        <div className="mb-3">
                            <DropDown
                                name="newDate"
                                value={newDate}
                                placeholder="Select delivery date"
                                options={[
                                    "24 November, 2025",
                                    "25 November, 2025",
                                    "26 November, 2025",
                                ]}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>

                        <div className="mb-0">
                            <DropDown
                                name="newTime"
                                value={newTime}
                                placeholder="Select delivery time"
                                options={["9-12 AM", "12-3 PM", "3-6 PM"]}
                                onChange={(e) => setNewTime(e.target.value)}
                            />
                        </div>
                    </div>
                }
                confirmLabel="Save Changes"
                cancelLabel="Close"
                onConfirm={handleConfirmReschedule}
                onCancel={() => setShowRescheduleModal(false)}
            />
        </div>
    );
}
