import { useEffect, useRef, useState } from "react";
import "./ReportList.css";

import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import ViewButton from "../../../../Components/InternalSystem/Buttons/ViewButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";

import FilterDropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DatePicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";

import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function ReportsList() {
    // =================== UI STATE ===================
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // =================== DATA STATE ===================
    const [reports, setReports] = useState([]);
    const [reportTypeOptions, setReportTypeOptions] = useState([]);

    // =================== PAGINATION ===================
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    const [totalPages, setTotalPages] = useState(1);

    // =================== FILTERS ===================
    const [idSearch, setIdSearch] = useState("");
    const [nameSearch, setNameSearch] = useState("");
    const [selectedTypeId, setSelectedTypeId] = useState("");
    const [filterDate, setFilterDate] = useState(null);

    // validation (match Inventory pattern)
    const [idError, setIdError] = useState("");
    const [nameError, setNameError] = useState("");

    const filterDebounceRef = useRef(null);

    // =================== DELETE MODAL ===================
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const columns = [
        { key: "reportId", label: "Report ID" },
        { key: "reportName", label: "Report Name" },
        { key: "reportTypeName", label: "Report Type" },
        { key: "created", label: "Creation Date" },
        { key: "view", label: "View Details" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        view: (row) => <ViewButton to={`/report/details/${row.reportId}`} text="View Details" />,
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.reportId);
                    setShowModal(true);
                }}
            />
        )
    };

    useEffect(() => {
        fetchReportTypes();
    }, []);

    useEffect(() => {
        fetchReports(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchReports(1);
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idSearch, nameSearch, selectedTypeId, filterDate]);

    async function fetchReportTypes() {
        try {
            const res = await fetch("/api/ReportTypes", { credentials: "include" });
            if (!res.ok) return setReportTypeOptions([]);

            const data = await res.json();
            const items = data.items ?? [];

            setReportTypeOptions(
                (items || []).map((x) => ({
                    value: x.value,
                    label: x.label
                }))
            );
        } catch {
            setReportTypeOptions([]);
        }
    }

    function formatDate(dateValue) {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    async function fetchReports(pageNumber = 1) {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", String(pageNumber));
            params.set("pageSize", String(pageSize));

            if (idSearch?.trim()) params.set("reportId", idSearch.trim());
            if (nameSearch?.trim()) params.set("reportName", nameSearch.trim());
            if (selectedTypeId) params.set("reportTypeId", selectedTypeId);

            if (filterDate) {
                const raw = filterDate;
                params.set(
                    "creationDate",
                    `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`
                );
            }

            const res = await fetch(`/api/Reports?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);

            const data = await res.json();

            const items = data.items ?? [];
            const mapped = (items || []).map((r) => ({
                reportId: r.reportId ?? r.ReportId ?? null,
                reportName: r.reportName ?? r.ReportName ?? "—",
                reportTypeName: r.reportTypeName ?? r.ReportTypeName ?? "—",
                created: formatDate(r.reportCreationTimestamp ?? r.ReportCreationTimestamp)
            }));

            setReports(mapped);

            const totalCount = data.totalCount ?? mapped.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
        } catch (err) {
            setError(err?.message || "Unable to load reports.");
            setReports([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }

    // =================== VALIDATION ===================
    const handleIdChange = (e) => {
        const val = e.target.value;

        if (/^[0-9]*$/.test(val)) {
            setIdError("");
            setIdSearch(val);
        } else {
            setIdError("Only numbers allowed.");
        }
    };

    const handleNameChange = (e) => {
        const val = e.target.value;

        if (/^[A-Za-z0-9 .+\-]*$/.test(val)) {
            setNameError("");
            setNameSearch(val);
        } else {
            setNameError("Only letters, numbers, spaces, dot (.), - and + allowed.");
        }
    };

    const handleClearFilters = () => {
        setIdSearch("");
        setNameSearch("");
        setSelectedTypeId("");
        setFilterDate(null);

        setIdError("");
        setNameError("");

        if (currentPage !== 1) setCurrentPage(1);
        else fetchReports(1);
    };

    function handleCloseDeleteModal() {
        setShowModal(false);
        setDeleteId(null);
    }

    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`/api/Reports/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) {
                const msg = await res.text().catch(() => "");
                throw new Error(msg || `Delete failed (${res.status})`);
            }

            setReports((prev) => prev.filter((r) => r.reportId !== deleteId));
        } catch (err) {
            console.error("Delete report error:", err);
            setError(err?.message || "Failed to delete report.");
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    return (
        <div className="reports-page">
            <h2 className="text-center fw-bold reports-title">Reports</h2>

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter report id for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Report by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />

                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter report name for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${nameError ? "is-invalid" : ""}`}
                            placeholder="Search Report by Name"
                            value={nameSearch}
                            onChange={handleNameChange}
                        />

                        <div style={{ height: "20px" }}>
                            {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                        </div>
                    </div>
                </FilterLeft>

                <FilterRight>
                    <div className="d-flex gap-2">
                        <ClearButton onClear={handleClearFilters} />
                        <PageAddButton to="/reports/generate" text="Generate New Report" />
                    </div>
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select report type for automatic search</div>

                        <FilterDropdown
                            placeholder="Filter by Report Type"
                            options={reportTypeOptions}
                            value={selectedTypeId}
                            onChange={(e) => {
                                setSelectedTypeId(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        <div style={{ height: "20px" }}></div>
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select creation date for automatic search</div>

                        <DatePicker
                            selected={filterDate}
                            onChange={(d) => {
                                setFilterDate(d);
                                setCurrentPage(1);
                            }}
                            placeholderText="Filter by Creation Date"
                        />
                    </div>
                </FilterLeft>
            </FilterSection>

            {loading && <div className="text-center text-muted my-3">Loading reports...</div>}
            {error && <div className="alert alert-danger w-50" style={{ margin: "20px auto" }}>{error}</div>}

            <DataTable
                columns={columns}
                data={reports}
                renderMap={renderMap}
                tableClass="reports-table"
            />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />

            <DeleteModal
                show={showModal}
                onClose={handleCloseDeleteModal}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this report?"
            />
        </div>
    );
}
