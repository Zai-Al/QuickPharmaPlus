import { useState, useEffect, useRef } from "react";
import "./PerscriptionsList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../Components/InternalSystem/GeneralComponents/DatePicker";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import ViewButton from "../../../Components/InternalSystem//Buttons/ViewButton";
import CLearButton from "../../../Components/InternalSystem//Buttons/CLearButton";

import { StatusBadge } from "../../External_System/Shared_Components/statusUI.jsx";

export default function PrescriptionList() {
    /* ---------------------------- */
    /*         FILTER STATES        */
    /* ---------------------------- */
    const [filterDate, setFilterDate] = useState(null);
    const [prescriptionData, setPrescriptionData] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [customers, setCustomers] = useState([]); // State for customers
    const [loading, setLoading] = useState(true);

    // ==========================
    // FRONTEND PAGINATION (NEW)
    // ==========================
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); // kept in case you add a page-size UI later
    const [totalPages, setTotalPages] = useState(1);

    // ==========================
    // STATUS FILTER (kept as dropdown) (NEW state only)
    // ==========================
    const [selectedStatus, setSelectedStatus] = useState("");

    // ==========================
    // SEARCHABLE CUSTOMER DROPDOWN (EXACT COPY PATTERN)
    // ==========================
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [customerQuery, setCustomerQuery] = useState("");
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [customerHighlightIndex, setCustomerHighlightIndex] = useState(0);
    const customerRef = useRef(null);

    const filterDebounceRef = useRef(null);

    // NEW — validation state (same behavior as Inventory)
    const [customerError, setCustomerError] = useState("");

    /* ---------------------------- */
    /*      FETCH PRESCRIPTIONS     */
    /* ---------------------------- */
    useEffect(() => {
        fetchPrescriptions(1);
        fetchStatuses();
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ================
    // Auto-filter debounce (same pattern)
    // ================
    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchPrescriptions(1);
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer, selectedStatus, filterDate, pageSize]);

    // ================
    // When page changes, fetch that page
    // ================
    useEffect(() => {
        fetchPrescriptions(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // ================
    // Keep input text synced with selected customer
    // ================
    useEffect(() => {
        if (selectedCustomer) {
            setCustomerQuery(selectedCustomer.label ?? "");
        } else {
            setCustomerQuery("");
        }
    }, [selectedCustomer]);

    // ================
    // Close dropdown on outside click (exact pattern)
    // ================
    useEffect(() => {
        const onDocClick = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) {
                setShowCustomerDropdown(false);
                setCustomerHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    const statusFromId = (id) => {
        switch (Number(id)) {
            case 1: return "Approved";
            case 2: return "Pending Approval";
            case 3: return "Expired";
            case 4: return "Rejected";
            default: return "Unknown";
        }
    };

    async function fetchPrescriptions(pageNumber = 1) {
        setLoading(true);

        try {
            const params = new URLSearchParams();

            params.set("pageNumber", String(pageNumber));
            params.set("pageSize", String(pageSize));

            if (selectedCustomer && selectedCustomer.value) {
                params.set("customerId", String(selectedCustomer.value));
            }

            if (selectedStatus && String(selectedStatus).trim() !== "") {
                params.set("statusId", String(selectedStatus));
            }

            if (filterDate) {
                const raw = filterDate;
                params.set(
                    "date",
                    `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`
                );
            }

            const res = await fetch(
                `/api/Prescription?${params.toString()}`,
                { credentials: "include" }
            );

            if (!res.ok) throw new Error(`Failed to fetch prescriptions (${res.status})`);

            const data = await res.json();

            const items = data.items || [];
            const totalCount = data.totalCount ?? items.length;

            const mappedData = items.map((p) => {
                const statusName = (p.prescriptionStatusName ?? "").trim();
                const statusId = p.prescriptionStatusId;
                const badgeStatus = statusName || statusFromId(statusId);

                return {
                    id: p.prescriptionId,
                    patientName: p.patientName ?? "—",
                    prescriptionName: p.prescriptionName ?? "—",
                    productNames: p.productNames ?? "—",
                    branch: p.cityName ?? "—",
                    expiry: p.prescriptionCreationDate,
                    statusDisplay: <StatusBadge status={badgeStatus} />,
                    rquestedQuantity: p.rquestedQuantity ?? p.RequestedQuantity ?? "—",
                    requestedQuantity: p.requestedQuantity ?? p.RequestedQuantity ?? "—",
                };
            });

            setPrescriptionData(mappedData);
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchStatuses() {
        try {
            const res = await fetch(
                `/api/Prescription/statuses`,
                { credentials: "include" }
            );

            if (!res.ok) throw new Error(`Failed to fetch statuses (${res.status})`);

            const data = await res.json();
            console.log("STATUSES FROM API:", data);

            setStatuses(
                data.map(s => ({
                    value: s.prescriptionStatusId,
                    label: s.prescriptionStatusName
                }))
            );
        } catch (error) {
            console.error("Error fetching statuses:", error);
        }
    }

    async function fetchCustomers() {
        try {
            const res = await fetch(`/api/user/customers`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to fetch customers (${res.status})`);

            const data = await res.json();
            setCustomers(data.map(c => ({ value: c.userId, label: c.fullName })));
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    }

    const columns = [
        { key: "patientName", label: "Patient Name" },
        { key: "prescriptionName", label: "Prescription Name" },
        { key: "branch", label: "Branch" },
        { key: "expiry", label: "Expiry Date" },
        { key: "statusDisplay", label: "Status" },
        { key: "view", label: "View Details" }
    ];

    const renderMap = {
        view: (row) => <ViewButton to={`/prescription/view/${row.id}`} text="View Details" />
    };

    // ==========================
    // VALIDATION RULE — same as Inventory (allowed characters)
    // ==========================
    const isValidCustomerInput = (val) =>
        /^[A-Za-z0-9+\- ]*$/.test(val);

    // Prefix match — same as Inventory
    const filteredCustomers = (customerQuery ?? "")
        ? (customers || []).filter(c =>
            String(c.label ?? "").toLowerCase().startsWith(String(customerQuery).toLowerCase())
        )
        : customers;

    const handleCustomerInputChange = (e) => {
        const val = e.target.value;

        if (!isValidCustomerInput(val)) {
            setCustomerError("Only letters, numbers, spaces, - and + allowed.");
        } else {
            setCustomerError("");
            setCustomerQuery(val);
            setShowCustomerDropdown(true);
            setCustomerHighlightIndex(0);
            if (!val) setSelectedCustomer(null);
        }
    };

    const handleCustomerInputFocus = () => {
        setShowCustomerDropdown(true);
        setCustomerHighlightIndex(0);
    };

    const handleCustomerKeyDown = (e) => {
        if (!showCustomerDropdown) return;
        const list = filteredCustomers || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setCustomerHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCustomerHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[customerHighlightIndex];
            if (picked) handleSelectCustomer(picked);
        } else if (e.key === "Escape") {
            setShowCustomerDropdown(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerQuery(customer.label ?? "");
        setShowCustomerDropdown(false);
        setCustomerHighlightIndex(0);
    };

    return (
        <div className="prescriptions-page">
            {/* TITLE */}
            <h2 className="text-center fw-bold prescriptions-title">Prescriptions</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>

                    {/* EXACT COPY STRUCTURE (label + input + error + dropdown) */}
                    <div className="mb-2" ref={customerRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select patient for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${customerError ? "is-invalid" : ""}`}
                            placeholder={customers.length === 0 ? "Loading patients..." : "Search or select patient"}
                            value={customerQuery ?? ""}
                            onChange={handleCustomerInputChange}
                            onFocus={handleCustomerInputFocus}
                            onKeyDown={handleCustomerKeyDown}
                            disabled={customers.length === 0}
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {customerError && <div className="invalid-feedback d-block">{customerError}</div>}
                        </div>

                        {showCustomerDropdown && (filteredCustomers || []).length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto", width: 340 }}>
                                {filteredCustomers.map((c, idx) => (
                                    <li
                                        key={c.value}
                                         onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectCustomer(c)}
                                        onMouseEnter={() => setCustomerHighlightIndex(idx)}
                                    >
                                        {c.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* STATUS: kept as-is, only wired to state */}
                    <div className="mb-4" style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">
                            Select status for automatic search
                        </div>

                        <FilterDropdown
                            name="status"
                            placeholder="Filter Prescription by Status"
                            className="form-control filter-text-input"
                            options={statuses}
                            value={selectedStatus || ""}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                </FilterLeft>

                <FilterRight>
                    <CLearButton
                        onClear={() => {
                            setFilterDate(null);
                            setSelectedCustomer(null);
                            setCustomerQuery("");
                            setCustomerError("");
                            setSelectedStatus("");

                            if (currentPage !== 1) setCurrentPage(1);
                            else fetchPrescriptions(1);
                        }}
                    />
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select date for automatic search</div>
                        <DataPicker
                            name="prescriptionDate"
                            selected={filterDate}
                            onChange={(d) => setFilterDate(d)}
                            placeholderText="Search Prescription by Date"
                        />
                    </div>
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <DataTable
                    columns={columns}
                    data={prescriptionData}
                    renderMap={renderMap}
                />
            )}

            {/* PAGINATION (wired like Inventory) */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />
        </div>
    );
}
