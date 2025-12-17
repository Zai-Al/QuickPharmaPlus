import { useState, useEffect, useRef } from "react";
import "./LogsList.css";

/* ===========================
   INTERNAL SYSTEM COMPONENTS
   =========================== */

// Correct import depth for Admin folder
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";
import DataPicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function Logs() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    /* -------------------------------------------- */
    /*                   STATE                      */
    /* -------------------------------------------- */
    const [quickPharmaLogs, setQuickPharmaLogs] = useState([]);
    const [totalPages, setTotalPages] = useState(1);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10);

    // Filters
    const [logIdSearch, setLogIdSearch] = useState("");
    const [selectedLogType, setSelectedLogType] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [filterDate, setFilterDate] = useState(null);

    // Dropdown options
    const [logTypes, setLogTypes] = useState([]);
    const [employees, setEmployees] = useState([]);

    // Searchable dropdown states for Log Type
    const [logTypeQuery, setLogTypeQuery] = useState("");
    const [showLogTypeDropdown, setShowLogTypeDropdown] = useState(false);
    const [logTypeHighlightIndex, setLogTypeHighlightIndex] = useState(0);
    const logTypeRef = useRef(null);

    // Searchable dropdown states for Employee
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [employeeHighlightIndex, setEmployeeHighlightIndex] = useState(0);
    const employeeRef = useRef(null);

    // Loading states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Validation errors
    const [logIdError, setLogIdError] = useState("");
    const [logTypeError, setLogTypeError] = useState("");
    const [employeeError, setEmployeeError] = useState("");

    // Debounce ref
    const filterDebounceRef = useRef(null);

    /* -------------------------------------------- */
    /*               TABLE COLUMNS                  */
    /* -------------------------------------------- */
    const columns = [
        { key: "id", label: "Log ID" },
        { key: "type", label: "Log Type" },
        { key: "description", label: "Action Description" },
        { key: "date", label: "Action Date" },
        { key: "employee", label: "Employee Name" }
    ];

    const renderMap = {}; // no buttons in logs table

    /* -------------------------------------------- */
    /*              HELPER FUNCTIONS                */
    /* -------------------------------------------- */
    function formatDateTime(dateValue) {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        const date = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        return `${date} ${time}`;
    }

    /* -------------------------------------------- */
    /*              API CALLS                       */
    /* -------------------------------------------- */
    async function fetchLogTypes() {
        try {
            const res = await fetch(`${baseURL}/api/QuickPharmaLog/types`, {
                credentials: "include"
            });
            if (!res.ok) return;
            const data = await res.json();
            setLogTypes(data || []);
        } catch (err) {
            console.error("Failed to fetch log types:", err);
        }
    }

    async function fetchEmployees() {
        try {
            // FIXED: Changed from /api/Employees/employees to /api/Employees
            const res = await fetch(`${baseURL}/api/Employees?pageNumber=1&pageSize=500`, {
                credentials: "include"
            });
            if (!res.ok) return;
            const data = await res.json();
            const items = data.items || data.Items || [];
            const empList = items.map(u => ({
                userId: u.userId || u.UserId,
                fullName: `${u.firstName || u.FirstName || ""} ${u.lastName || u.LastName || ""}`.trim()
            }));
            setEmployees(empList);
        } catch (err) {
            console.error("Failed to fetch employees:", err);
        }
    }

    async function fetchQuickPharmaLogs(pageNumber = 1) {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", String(pageNumber));
            params.set("pageSize", String(pageSize));

            if (logIdSearch.trim()) {
                params.set("search", logIdSearch.trim());
            }

            if (selectedLogType) {
                params.set("logTypeId", String(selectedLogType.logTypeId));
            }

            if (selectedEmployee) {
                params.set("employeeName", selectedEmployee.fullName);
            }

            if (filterDate) {
                const raw = filterDate;
                params.set("actionDate", `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`);
            }

            const res = await fetch(`${baseURL}/api/QuickPharmaLog?${params.toString()}`, {
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Failed to load QuickPharma logs (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map(log => ({
                id: log.logId,
                type: log.logTypeName || "N/A",
                description: log.logDescription || "",
                date: formatDateTime(log.logTimestamp),
                employee: log.employeeName || "System"
            }));

            setQuickPharmaLogs(mapped);

            const totalCount = data.totalCount || mapped.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));

        } catch (err) {
            console.error("Error fetching QuickPharma logs:", err);
            setError("Unable to load QuickPharma logs.");
        } finally {
            setLoading(false);
        }
    }

    /* -------------------------------------------- */
    /*          VALIDATION RULES                    */
    /* -------------------------------------------- */
    const isValidLogTypeInput = (val) => /^[A-Za-z ]*$/.test(val);
    const isValidEmployeeInput = (val) => /^[A-Za-z \-]*$/.test(val);

    /* -------------------------------------------- */
    /*      LOG TYPE SEARCHABLE DROPDOWN            */
    /* -------------------------------------------- */
    const filteredLogTypes = (logTypeQuery ?? "")
        ? (logTypes || []).filter(lt =>
            String(lt.logTypeName ?? "").toLowerCase().startsWith(String(logTypeQuery).toLowerCase())
        )
        : logTypes;

    const handleLogTypeInputChange = (e) => {
        const val = e.target.value;

        if (!isValidLogTypeInput(val)) {
            setLogTypeError("Only letters and spaces allowed.");
        } else {
            setLogTypeError("");
            setLogTypeQuery(val);
            setShowLogTypeDropdown(true);
            setLogTypeHighlightIndex(0);
            if (!val) setSelectedLogType(null);
        }
    };

    const handleLogTypeInputFocus = () => {
        setShowLogTypeDropdown(true);
        setLogTypeHighlightIndex(0);
    };

    const handleLogTypeKeyDown = (e) => {
        if (!showLogTypeDropdown) return;
        const list = filteredLogTypes || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setLogTypeHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setLogTypeHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[logTypeHighlightIndex];
            if (picked) handleSelectLogType(picked);
        } else if (e.key === "Escape") {
            setShowLogTypeDropdown(false);
        }
    };

    const handleSelectLogType = (logType) => {
        setSelectedLogType(logType);
        setLogTypeQuery(logType.logTypeName ?? "");
        setShowLogTypeDropdown(false);
        setLogTypeHighlightIndex(0);
    };

    /* -------------------------------------------- */
    /*      EMPLOYEE SEARCHABLE DROPDOWN            */
    /* -------------------------------------------- */
    const filteredEmployees = (employeeQuery ?? "")
        ? (employees || []).filter(emp =>
            String(emp.fullName ?? "").toLowerCase().startsWith(String(employeeQuery).toLowerCase())
        )
        : employees;

    const handleEmployeeInputChange = (e) => {
        const val = e.target.value;

        if (!isValidEmployeeInput(val)) {
            setEmployeeError("Only letters, spaces, and dash (-) allowed.");
        } else {
            setEmployeeError("");
            setEmployeeQuery(val);
            setShowEmployeeDropdown(true);
            setEmployeeHighlightIndex(0);
            if (!val) setSelectedEmployee(null);
        }
    };

    const handleEmployeeInputFocus = () => {
        setShowEmployeeDropdown(true);
        setEmployeeHighlightIndex(0);
    };

    const handleEmployeeKeyDown = (e) => {
        if (!showEmployeeDropdown) return;
        const list = filteredEmployees || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setEmployeeHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setEmployeeHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[employeeHighlightIndex];
            if (picked) handleSelectEmployee(picked);
        } else if (e.key === "Escape") {
            setShowEmployeeDropdown(false);
        }
    };

    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeQuery(employee.fullName ?? "");
        setShowEmployeeDropdown(false);
        setEmployeeHighlightIndex(0);
    };

    /* -------------------------------------------- */
    /*          VALIDATION HANDLERS                 */
    /* -------------------------------------------- */
    
    // LIVE VALIDATION FOR LOG ID (NUMBERS ONLY)
    const handleLogIdChange = (e) => {
        const val = e.target.value;

        if (/^[0-9]*$/.test(val)) {
            setLogIdError("");
            setLogIdSearch(val);
        } else {
            setLogIdError("Only numbers allowed.");
        }
    };

    /* -------------------------------------------- */
    /*          CLEAR FILTERS HANDLER               */
    /* -------------------------------------------- */
    const handleClearFilters = () => {
        setLogIdSearch("");
        setSelectedLogType(null);
        setLogTypeQuery("");
        setSelectedEmployee(null);
        setEmployeeQuery("");
        setFilterDate(null);
        setLogIdError("");
        setLogTypeError("");
        setEmployeeError("");

        if (currentPage !== 1) setCurrentPage(1);
        else fetchQuickPharmaLogs(1);
    };

    /* -------------------------------------------- */
    /*              EFFECTS                         */
    /* -------------------------------------------- */
    useEffect(() => {
        fetchLogTypes();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchQuickPharmaLogs(currentPage);
    }, [currentPage]);

    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchQuickPharmaLogs(1);
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
    }, [logIdSearch, selectedLogType, selectedEmployee, filterDate]);

    // Update query when selection changes
    useEffect(() => {
        if (selectedLogType) {
            setLogTypeQuery(selectedLogType.logTypeName ?? "");
        } else {
            setLogTypeQuery("");
        }
    }, [selectedLogType]);

    useEffect(() => {
        if (selectedEmployee) {
            setEmployeeQuery(selectedEmployee.fullName ?? "");
        } else {
            setEmployeeQuery("");
        }
    }, [selectedEmployee]);

    // Close dropdowns on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (logTypeRef.current && !logTypeRef.current.contains(e.target)) {
                setShowLogTypeDropdown(false);
                setLogTypeHighlightIndex(0);
            }
            if (employeeRef.current && !employeeRef.current.contains(e.target)) {
                setShowEmployeeDropdown(false);
                setEmployeeHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    return (
        <div className="logs-page">

            {/* TITLE */}
            <h2 className="text-center fw-bold logs-title">QuickPharma Logs</h2>

            {/* FILTER SECTION 1 */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter log ID for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${logIdError ? "is-invalid" : ""}`}
                            placeholder="Search Log by ID"
                            value={logIdSearch}
                            onChange={handleLogIdChange}
                        />

                        {/* Reserved space for error display */}
                        <div style={{ height: "20px" }}>
                            {logIdError && <div className="invalid-feedback d-block">{logIdError}</div>}
                        </div>
                    </div>

                    <div className="mb-2" ref={logTypeRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select log type for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${logTypeError ? "is-invalid" : ""}`}
                            placeholder={logTypes.length === 0 ? "Loading log types..." : "Search or select log type"}
                            value={logTypeQuery ?? ""}
                            onChange={handleLogTypeInputChange}
                            onFocus={handleLogTypeInputFocus}
                            onKeyDown={handleLogTypeKeyDown}
                            disabled={logTypes.length === 0}
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {logTypeError && <div className="invalid-feedback d-block">{logTypeError}</div>}
                        </div>

                        {showLogTypeDropdown && (filteredLogTypes || []).length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown log-type-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredLogTypes.map((lt, idx) => (
                                    <li
                                        key={lt.logTypeId}
                                        className={`list-group-item list-group-item-action ${idx === logTypeHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectLogType(lt)}
                                        onMouseEnter={() => setLogTypeHighlightIndex(idx)}
                                    >
                                        {lt.logTypeName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </FilterLeft>

                <FilterRight>
                    <ClearButton onClear={handleClearFilters} />
                </FilterRight>
            </FilterSection>

            {/* FILTER SECTION 2 */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2" ref={employeeRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small"
                            style={{ fontSize: "0.9rem", whiteSpace: "nowrap" }}>Search or select employee name for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${employeeError ? "is-invalid" : ""}`}
                            placeholder={employees.length === 0 ? "Loading employees..." : "Search or select employee"}
                            value={employeeQuery ?? ""}
                            onChange={handleEmployeeInputChange}
                            onFocus={handleEmployeeInputFocus}
                            onKeyDown={handleEmployeeKeyDown}
                            disabled={employees.length === 0}
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {employeeError && <div className="invalid-feedback d-block">{employeeError}</div>}
                        </div>

                        {showEmployeeDropdown && (filteredEmployees || []).length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown employee-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredEmployees.map((emp, idx) => (
                                    <li
                                        key={emp.userId}
                                        className={`list-group-item list-group-item-action ${idx === employeeHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectEmployee(emp)}
                                        onMouseEnter={() => setEmployeeHighlightIndex(idx)}
                                    >
                                        {emp.fullName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select action date for automatic search</div>

                        <DataPicker
                            name="actionDate"
                            selected={filterDate}
                            onChange={(d) => setFilterDate(d)}
                            placeholderText="Search Log by Action Date"
                        />

                        {/* Reserved space for consistency */}
                        <div style={{ height: "20px" }}></div>
                    </div>
                </FilterLeft>
            </FilterSection>

            {/* LOADING / ERROR */}
            {loading && <div className="text-center text-muted my-3">Loading QuickPharma logs...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* TABLE */}
            <DataTable
                columns={columns}
                data={quickPharmaLogs}
                renderMap={renderMap}
            />

            {/* PAGINATION */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

        </div>
    );
}