// src/Pages/External_System/MyOrders.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import { StatusBadge } from "../Shared_Components/StatusUI";
import formatCurrency from "../Shared_Components/formatCurrency.js";
import DropDown from "../Shared_Components/DropDown";
import "../Shared_Components/External_Style.css";

// temporary mock data – later you’ll replace with API data
const MOCK_ORDERS = [
    { id: "Order ID 1", dateLabel: "Today", total: 0, status: "Pending Approval" },
    { id: "Order ID 2", dateLabel: "Today", total: 0, status: "Approved" },
    { id: "Order ID 3", dateLabel: "Today", total: 0, status: "Completed" },
    { id: "Order ID 4", dateLabel: "Today", total: 0, status: "Rejected" },
    { id: "Order ID 5", dateLabel: "Today", total: 0, status: "Out for Delivery" },
    { id: "Order ID 5", dateLabel: "Today", total: 0, status: "Cancelled" },
];

export default function MyOrders() {
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState("");
    const [dateSort, setDateSort] = useState("");

    const orders = MOCK_ORDERS;
    const totalOrders = orders.length;

    const handleViewDetails = (orderId) => {
        // adjust route to whatever you’ll use for order details in your router
        navigate(`/myOrderDetails/${orderId}`);
    };

    const handleResetFilters = () => {
        setStatusFilter("");
        setDateSort("");
    };

    // apply simple filtering/sorting for now
    let displayedOrders = [...orders];

    if (statusFilter) {
        displayedOrders = displayedOrders.filter(
            (order) => order.status === statusFilter
        );
    }

    if (dateSort === "Oldest to Newest") {
        displayedOrders = [...displayedOrders].reverse();
    }
    // "Newest to Oldest" just keeps the default order for now

    const hasActiveFilters = Boolean(statusFilter || dateSort);

    return (
        <div className="min-vh-100">
            {/* top blue bar with title */}
            <PageHeader title="My Orders" />

            <div className="container py-4">
                {/* filters + total count row */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex gap-3 align-items-center">
                        {/* Dropdown 1 - Status */}
                        <DropDown
                            name="statusFilter"
                            value={statusFilter}
                            placeholder="Filter by Status"
                            options={[
                                "Pending Approval",
                                "Approved",
                                "Completed",
                                "Rejected",
                                "Out for Delivery",
                            ]}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="my-orders-filter form-select-sm"
                        />

                        {/* Dropdown 2 - Date Sort */}
                        <DropDown
                            name="dateSort"
                            value={dateSort}
                            placeholder="Sort by Date"
                            options={["Newest to Oldest", "Oldest to Newest"]}
                            onChange={(e) => setDateSort(e.target.value)}
                            className="my-orders-filter form-select-sm"
                        />

                        {/* Reset button – only shown when something is selected */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary reset-btn"
                                onClick={handleResetFilters}
                            >
                                Reset
                            </button>
                        )}
                    </div>

                    {/* total count on the right */}
                    <span className="fw-semibold">
                        Total Number of Orders: {totalOrders}
                    </span>
                </div>

                {/* table */}
                <TableFormat
                    headers={[
                        "Order ID",
                        "Order Date",
                        "Total",
                        "Order Status",
                        "", // for the button column
                    ]}
                    headerBg="#54B2B5"
                >
                    {displayedOrders.map((order, index) => (
                        <tr key={index}>
                            <td className="align-middle">{order.id}</td>

                            <td className="align-middle fw-semibold">
                                {order.dateLabel}
                            </td>

                            <td className="align-middle">
                                {formatCurrency(order.total)}
                            </td>

                            <td className="align-middle">
                                <StatusBadge status={order.status} />
                            </td>

                            <td className="align-middle">
                                <button
                                    className="btn btn-sm qp-add-btn"
                                    style={{ width: "160px" }}
                                    onClick={() => handleViewDetails(order.id)}
                                >
                                    View Order Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </TableFormat>
            </div>
        </div>
    );
}
