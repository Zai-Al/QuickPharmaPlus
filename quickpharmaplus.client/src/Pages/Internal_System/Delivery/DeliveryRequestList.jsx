import { useEffect, useMemo, useState } from "react";
import "./DeliveryRequestList.css";

import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import ClearButton from "../../../Components/InternalSystem/Buttons/ClearButton";
import UrgencyIndicator from "../../../Components/InternalSystem/GeneralComponents/UrgencyIndicator";
import { StatusBadge } from "../../External_System/Shared_Components/statusUI.jsx";

async function fetchJsonStrict(url) {
    const res = await fetch(url, { credentials: "include" });
    const ct = res.headers.get("content-type") || "";
    const text = await res.text().catch(() => "");

    const meta = {
        requestedUrl: url,
        finalUrl: res.url,
        redirected: res.redirected,
        ok: res.ok,
        status: res.status,
        contentType: ct,
        bodyPreview: text.slice(0, 200),
    };

    if (!res.ok) {
        throw new Error(`Request failed (${res.status}) for ${url}. Preview: ${meta.bodyPreview}`);
    }

    if (!ct.includes("application/json")) {
        throw new Error(
            `Expected JSON but got '${ct}' for ${url}. ` +
                `redirected=${meta.redirected} finalUrl=${meta.finalUrl}. ` +
                `Preview: ${meta.bodyPreview}`
        );
    }

    return { json: text ? JSON.parse(text) : null, meta };
}

export default function DeliveryRequests() {
    const isDev = import.meta.env.DEV;

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    // filters
    const [orderIdSearch, setOrderIdSearch] = useState("");
    const [statusId, setStatusId] = useState("");
    const [paymentMethodId, setPaymentMethodId] = useState("");
    const [urgency, setUrgency] = useState("");

    // dropdown options
    const [statusOptions, setStatusOptions] = useState([]);
    const [paymentOptions, setPaymentOptions] = useState([]);

    // debug panels
    const [statusesDebug, setStatusesDebug] = useState(null);
    const [paymentsDebug, setPaymentsDebug] = useState(null);

    // popup edit state
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [editStatusId, setEditStatusId] = useState("");
    const [cashPaidChecked, setCashPaidChecked] = useState(false);
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    const urgencyOptions = useMemo(
        () => [
            { value: "true", label: "Urgent" },
            { value: "false", label: "Not Urgent" },
        ],
        []
    );

    const getAllowedNextStatusIds = (currentStatusId) => {
        const s = Number(currentStatusId);
        if (s === 1) return [2];
        if (s === 2) return [3];
        return [];
    };

    const isCashMethodName = (name) => {
        const s = String(name || "").trim().toLowerCase();
        return s === "cash" || s === "pay on delivery";
    };

    const columns = [
        { key: "orderId", label: "Order ID" },
        { key: "shippingId", label: "Shipping ID" },
        { key: "customerName", label: "Recipient" },
        { key: "location", label: "Location" },
        { key: "paymentMethod", label: "Payment" },
        { key: "slotName", label: "Slot" },
        { key: "isUrgent", label: "Urgency" },
        { key: "customerPhone", label: "Phone" },
        { key: "customerEmail", label: "Email" },
        { key: "status", label: "Status" },
        { key: "edit", label: "Modify Status" },
    ];

    const openEditPopup = (row) => {
        const allowed = getAllowedNextStatusIds(row?.orderStatusId);
        if (!allowed.length) return; // status=3 or invalid

        setEditError("");
        setEditRow(row);

        // Auto-select the only valid next status
        setEditStatusId(String(allowed[0]));
        setCashPaidChecked(false);
        setShowEditPopup(true);
    };

    const closeEditPopup = () => {
        if (savingEdit) return;
        setShowEditPopup(false);
        setEditRow(null);
        setEditStatusId("");
        setCashPaidChecked(false);
        setEditError("");
    };

    const allowedNextStatuses = useMemo(() => {
        const allowed = getAllowedNextStatusIds(editRow?.orderStatusId);
        return statusOptions.filter((o) => allowed.includes(Number(o.value)));
    }, [editRow?.orderStatusId, statusOptions]);

    const selectedStatusIsDelivered = String(editStatusId) === "3";
    const shouldShowCashPaidCheckbox =
        selectedStatusIsDelivered && isCashMethodName(editRow?.paymentMethod);

    const saveEdit = async () => {
        if (!editRow?.orderId) {
            setEditError("Missing orderId.");
            return;
        }

        const newStatusIdNum = Number(editStatusId);
        const allowed = getAllowedNextStatusIds(editRow?.orderStatusId);

        if (!allowed.includes(newStatusIdNum)) {
            setEditError("Invalid status transition.");
            return;
        }

        setSavingEdit(true);
        setEditError("");

        try {
            const res = await fetch(`/api/DeliveryRequests/${editRow.orderId}/status`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    newStatusId: newStatusIdNum,
                    markCashPaymentSuccessful: shouldShowCashPaidCheckbox ? !!cashPaidChecked : false,
                }),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok || json?.updated !== true) {
                throw new Error(json?.message || `Failed to update status (${res.status})`);
            }

            const statusLabel =
                statusOptions.find((s) => String(s.value) === String(newStatusIdNum))?.label ??
                (newStatusIdNum === 1 ? "Confirmed" : newStatusIdNum === 2 ? "Out for Delivery" : "Delivered");

            setItems((prev) =>
                (prev || []).map((x) =>
                    x.orderId === editRow.orderId
                        ? { ...x, orderStatusId: newStatusIdNum, orderStatusName: statusLabel }
                        : x
                )
            );

            closeEditPopup();
        } catch (e) {
            setEditError(e?.message || "Failed to update order status.");
        } finally {
            setSavingEdit(false);
        }
    };

    const renderMap = {
        isUrgent: (row) => <UrgencyIndicator urgent={row.isUrgent} />,
        status: (row) => <StatusBadge status={row.orderStatusName} />,

        // Disable edit when status is Delivered (3)
        edit: (row) =>
            Number(row.orderStatusId) === 3 ? (
                <button type="button" className="btn btn-secondary btn-sm w-100" disabled>
                    Completed
                </button>
            ) : (
                <EditButton onClick={() => openEditPopup(row)} />
            ),
    };

    const mappedRows = useMemo(() => {
        return (items || []).map((x) => ({
            orderId: x.orderId,
            shippingId: x.shippingId,
            location: x.location,
            paymentMethod: x.paymentMethod,
            slotName: x.slotName,
            isUrgent: !!x.isUrgent,
            customerName: x.customerName,
            customerPhone: x.customerPhone,
            customerEmail: x.customerEmail,
            orderStatusId: x.orderStatusId,
            orderStatusName: x.orderStatusName,
        }));
    }, [items]);

    // --- Fetch statuses ---
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setStatusesDebug(null);

            try {
                const url = "/api/OrderStatuses";
                const { json, meta } = await fetchJsonStrict(url);

                const list = Array.isArray(json) ? json : [];
                const mapped = list.map((s) => ({
                    value: String(s.orderStatusId),
                    label: s.orderStatusName || `Status #${s.orderStatusId}`,
                }));

                if (!cancelled) {
                    setStatusOptions(mapped);
                    setStatusesDebug({ ...meta, mappedCount: mapped.length });
                }
            } catch (e) {
                if (!cancelled) {
                    setStatusOptions([]);
                    setStatusesDebug({ error: e?.message || String(e) });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // --- Fetch payments ---
    useEffect(() => {
        let cancelled = false;

        (async () => {
            setPaymentsDebug(null);

            try {
                const url = "/api/OrderPaymentMethods";
                const { json, meta } = await fetchJsonStrict(url);

                const list = Array.isArray(json) ? json : (json?.items || json?.Items || []);
                const mapped = (Array.isArray(list) ? list : [])
                    .map((p) => ({
                        value: String(p.paymentMethodId ?? p.paymentMethodID ?? p.id ?? p.Id ?? ""),
                        label: p.paymentMethodName ?? p.paymentMethod ?? p.name ?? p.Name ?? "",
                    }))
                    .filter((x) => x.value !== "" && x.label !== "");

                if (!cancelled) {
                    setPaymentOptions(mapped);
                    setPaymentsDebug({ ...meta, mappedCount: mapped.length });
                }
            } catch (e) {
                if (!cancelled) {
                    setPaymentOptions([]);
                    setPaymentsDebug({ error: e?.message || String(e) });
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    // reset page when filters change
    useEffect(() => {
        const t = setTimeout(() => setCurrentPage(1), 250);
        return () => clearTimeout(t);
    }, [orderIdSearch, statusId, paymentMethodId, urgency]);

    // fetch delivery requests
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");

            try {
                const params = new URLSearchParams();
                params.set("pageNumber", String(currentPage));
                params.set("pageSize", String(pageSize));

                const trimmed = (orderIdSearch || "").trim();
                if (trimmed) {
                    const n = Number(trimmed);
                    if (Number.isFinite(n) && n > 0) params.set("orderId", String(n));
                }

                if (statusId) params.set("statusId", statusId);
                if (paymentMethodId) params.set("paymentMethodId", paymentMethodId);
                if (urgency) params.set("isUrgent", urgency);

                const res = await fetch(`/api/DeliveryRequests?${params.toString()}`, {
                    credentials: "include",
                });

                if (!res.ok) throw new Error(`Failed to load delivery requests (${res.status})`);

                const data = await res.json();
                const list = data.items || data.Items || [];
                const totalCount = data.totalCount ?? data.TotalCount ?? list.length;

                setItems(list);
                setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
            } catch (e) {
                setItems([]);
                setTotalPages(1);
                setError(e?.message || "Failed to load delivery requests.");
            } finally {
                setLoading(false);
            }
        })();
    }, [currentPage, pageSize, orderIdSearch, statusId, paymentMethodId, urgency]);

    return (
        <div className="delivery-page">
            <h2 className="text-center fw-bold delivery-title">Delivery Requests</h2>

            <FilterSection>
                <FilterLeft>
                    <SearchTextField
                        placeholder="Search Order by ID"
                        value={orderIdSearch}
                        onChange={(e) => setOrderIdSearch(e.target.value)}
                    />

                    <FilterDropdown
                        placeholder="Filter Order by Status"
                        options={statusOptions}
                        value={statusId}
                        onChange={(e) => setStatusId(e.target.value)}
                    />
                </FilterLeft>

                <FilterRight>
                    <ClearButton
                        onClear={() => {
                            setOrderIdSearch("");
                            setStatusId("");
                            setPaymentMethodId("");
                            setUrgency("");
                            setError("");

                            if (currentPage !== 1) setCurrentPage(1);
                        }}
                    />
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <FilterDropdown
                        placeholder="Filter Order by Payment"
                        options={paymentOptions}
                        value={paymentMethodId}
                        onChange={(e) => setPaymentMethodId(e.target.value)}
                    />

                    <FilterDropdown
                        placeholder="Filter Order by Urgency"
                        options={urgencyOptions}
                        value={urgency}
                        onChange={(e) => setUrgency(e.target.value)}
                    />
                </FilterLeft>
            </FilterSection>

            {error && <div className="alert alert-danger mx-4">{error}</div>}

            {loading ? (
                <div className="text-center my-5">Loading...</div>
            ) : (
                <DataTable columns={columns} data={mappedRows} renderMap={renderMap} />
            )}

            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* POPUP */}
            {showEditPopup && (
                <div className="custom-popup-overlay" onMouseDown={closeEditPopup}>
                    <div className="custom-popup-box" onMouseDown={(e) => e.stopPropagation()}>
                        <h4 className="fw-bold mb-3 text-center">Modify Order Status</h4>

                        <div className="mb-2 text-muted small">Order #{editRow?.orderId}</div>

                        <div className="mb-3">
                            <div className="filter-label fst-italic small">Select new status</div>
                            <select
                                className="form-select"
                                value={editStatusId}
                                onChange={(e) => {
                                    setEditStatusId(e.target.value);
                                    setEditError("");
                                    setCashPaidChecked(false);
                                }}
                                disabled={savingEdit}
                            >
                                {/* Show CURRENT status (disabled) */}
                                <option value={String(editRow?.orderStatusId ?? "")} disabled>
                                    Current: {editRow?.orderStatusName ?? "—"}
                                </option>

                                {/* Show ONLY allowed next statuses (selectable) */}
                                {allowedNextStatuses.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        Change to: {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {shouldShowCashPaidCheckbox && (
                            <div className="form-check mb-3">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="cashPaid"
                                    checked={cashPaidChecked}
                                    onChange={(e) => setCashPaidChecked(e.target.checked)}
                                    disabled={savingEdit}
                                />
                                <label className="form-check-label" htmlFor="cashPaid">
                                    Payment completed (Cash)
                                </label>
                            </div>
                        )}

                        {editError && <div className="alert alert-danger py-2">{editError}</div>}

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <button className="btn-cancel-popup" onClick={closeEditPopup} disabled={savingEdit}>
                                Cancel
                            </button>
                            <button className="btn-save-popup" onClick={saveEdit} disabled={savingEdit}>
                                {savingEdit ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}