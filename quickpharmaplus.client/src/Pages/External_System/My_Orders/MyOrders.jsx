// src/Pages/External_System/MyOrders.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Shared_Components/PageHeader";
import TableFormat from "../Shared_Components/TableFormat";
import DropDown from "../Shared_Components/DropDown";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import { StatusBadge } from "../Shared_Components/statusUI";
import formatCurrency from "../Shared_Components/formatCurrency";
import { AuthContext } from "../../../Context/AuthContext";
import "../Shared_Components/External_Style.css";

export default function MyOrders() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const userId = user?.userId || user?.id;

    // backend filters
    const [statusId, setStatusId] = useState(""); // string id
    const [sortBy, setSortBy] = useState("date-desc");

    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // data
    const [items, setItems] = useState([]);
    const [totalCount, setTotalCount] = useState(0);

    // status dropdown options from DB
    const [statusOptions, setStatusOptions] = useState([]);
    const [loadingStatuses, setLoadingStatuses] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil((totalCount || 0) / pageSize));
    }, [totalCount, pageSize]);

    // reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [statusId, sortBy]);

    // fetch statuses once
    useEffect(() => {
        const run = async () => {
            setLoadingStatuses(true);
            try {
                const res = await fetch(`${API_BASE}/api/OrderStatuses`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load statuses (${res.status})`);
                }

                const json = await res.json();
                setStatusOptions(Array.isArray(json) ? json : []);
            } catch (e) {
                setStatusOptions([]);
            } finally {
                setLoadingStatuses(false);
            }
        };

        run();
    }, [API_BASE]);

    // fetch orders (backend paging + backend filtering)
    useEffect(() => {
        if (!userId) return;

        const fetchOrders = async () => {
            setLoading(true);
            setError("");

            try {
                const qs = new URLSearchParams();
                qs.set("userId", String(userId));
                qs.set("pageNumber", String(currentPage));
                qs.set("pageSize", String(pageSize));
                if (statusId) qs.set("statusId", String(statusId));
                if (sortBy) qs.set("sortBy", sortBy);

                const res = await fetch(`${API_BASE}/api/MyOrders?${qs.toString()}`, {
                    credentials: "include",
                });

                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || `Failed to load orders (${res.status})`);
                }

                const json = await res.json();
                setItems(Array.isArray(json?.items) ? json.items : []);
                setTotalCount(Number(json?.totalCount || 0));
            } catch (e) {
                setError(e?.message || "Failed to load orders.");
                setItems([]);
                setTotalCount(0);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [API_BASE, userId, currentPage, pageSize, statusId, sortBy]);

    const resetFilters = () => {
        setStatusId("");
        setSortBy("date-desc");
    };

    const statusDropDownOptions = useMemo(() => {
        // If your DropDown supports object options:
        return statusOptions.map((s) => ({
            value: String(s.orderStatusId),
            label: s.orderStatusName || `Status #${s.orderStatusId}`,
        }));
    }, [statusOptions]);

    return (
        <div className="min-vh-100">
            <PageHeader title="My Orders" />

            <div className="container py-4">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                        <DropDown
                            name="statusId"
                            value={statusId}
                            placeholder={loadingStatuses ? "Loading statuses..." : "Filter by Status"}
                            options={statusDropDownOptions}
                            onChange={(e) => setStatusId(e.target.value)}
                            className="form-select form-select-sm"
                            style={{ width: 240 }}
                            disabled={loadingStatuses}
                        />

                        <DropDown
                            name="sortBy"
                            value={sortBy}
                            placeholder="Sort by Date"
                            options={[
                                { value: "date-desc", label: "Newest to Oldest" },
                                { value: "date-asc", label: "Oldest to Newest" },
                                { value: "total-desc", label: "Total: High to Low" },
                                { value: "total-asc", label: "Total: Low to High" },
                            ]}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="form-select form-select-sm"
                            style={{ width: 240 }}
                        />

                        {(statusId || sortBy !== "date-desc") && (
                            <button className="btn btn-outline-secondary btn-sm" onClick={resetFilters}>
                                Reset
                            </button>
                        )}
                    </div>

                    <div className="fw-semibold">Total Orders: {totalCount}</div>
                </div>

                {loading && <div className="alert alert-info py-2">Loading...</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <TableFormat
                    headers={["Order ID", "Order Date", "Total", "Order Status", ""]}
                    headerBg="#54B2B5"
                >
                    {items.map((o) => (
                        <tr key={o.orderId}>
                            <td>{o.orderId}</td>

                            <td className="fw-semibold">
                                {o.orderCreationDate
                                    ? new Date(o.orderCreationDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })
                                    : "-"}
                            </td>

                            <td>{formatCurrency(o.orderTotal || 0)}</td>

                            <td>
                                <StatusBadge status={o.orderStatusName || ""} />
                            </td>

                            <td>
                                <button
                                    className="btn btn-sm qp-add-btn"
                                    style={{ width: 170 }}
                                    onClick={() => navigate(`/myOrderDetails/${o.orderId}`)}
                                >
                                    View Order Details
                                </button>
                            </td>
                        </tr>
                    ))}
                </TableFormat>

                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}
