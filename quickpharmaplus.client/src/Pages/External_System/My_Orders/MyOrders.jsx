// src/Pages/External_System/MyOrders.jsx
import { useNavigate } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import { StatusBadge } from "../Shared_Components/StatusBadge"; // adjust path if needed
import { formatCurrency } from "../Shared_Components/formatCurrency.js";


// temporary mock data – later you’ll replace with API data
const MOCK_ORDERS = [
    { id: "Order ID", dateLabel: "Today", total: 0, status: "Pending Approval" },
    { id: "Order ID", dateLabel: "Today", total: 0, status: "Approved" },
    { id: "Order ID", dateLabel: "Today", total: 0, status: "Completed" },
    { id: "Order ID", dateLabel: "Today", total: 0, status: "Rejected" },
    { id: "Order ID", dateLabel: "Today", total: 0, status: "Delivery" }, // Out for Delivery
];

export default function MyOrders() {
    const navigate = useNavigate();
    const orders = MOCK_ORDERS;
    const totalOrders = orders.length;

    const handleViewDetails = (orderId) => {
        // adjust route to whatever you’ll use for order details
        navigate(`/orders/${orderId}`);
    };

    return (
        <div className="bg-light min-vh-100">
            {/* top blue bar with title */}
            <PageHeader title="My Orders" />

            <div className="container py-4">
                {/* total number of orders */}
                <div className="d-flex justify-content-end mb-3">
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
                    headerBg="#54B2B5" // if your TableFormat supports a custom header color
                >
                    {orders.map((order, index) => (
                        <tr key={index}>
                            <td className="align-middle"> {order.id} </td>

                            <td className="align-middle fw-semibold">
                                {order.dateLabel}
                            </td>

                            <td className="align-middle">
                                {formatCurrency(order.total)}
                            </td>

                            <td className="align-middle">
                                <StatusBadge status={order.status} />
                            </td>

                            <td className="align-middle text-end">
                                <button
                                    type="button"
                                    className="btn btn-sm rounded-pill px-3"
                                    style={{
                                        backgroundColor: "#4C8BC4",
                                        borderColor: "#4C8BC4",
                                        color: "#fff",
                                    }}
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
