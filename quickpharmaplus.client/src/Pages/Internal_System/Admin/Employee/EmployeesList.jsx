import { useEffect, useState, useRef } from "react";
import "./EmployeesList.css";

// Components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";

import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";
import FilterDropDown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";

import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function EmployeesList() {

    // === DATA & UI STATE ===
    const [employees, setEmployees] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // === SEARCH STATE ===
    const [nameSearch, setNameSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");
    const [roleOptions, setRoleOptions] = useState([]);
    const [selectedRole, setSelectedRole] = useState("");

    // === NEW: BRANCH FILTER STATE ===
    const [branchOptions, setBranchOptions] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");

    const searchDebounceRef = useRef(null);

    // === NEW VALIDATION STATES ===
    const [nameError, setNameError] = useState("");
    const [idError, setIdError] = useState("");

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // === PAGING STATE ===
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const baseURL = import.meta.env.VITE_API_URL;
    console.log("API BASE URL =", import.meta.env.VITE_API_URL);

    // === VALIDATION REGEX ===
    const validNamePattern = /^[A-Za-z .-]*$/;
    const validIdPattern = /^[0-9]*$/;

    // === INITIAL: fetch roles and branches once ===
    useEffect(() => {
        fetchRoles();
        fetchBranches();  // NEW: Fetch branches
    }, []);

    async function fetchRoles() {
        try {
            const res = await fetch(`${baseURL}/api/roles`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const opts = (data || []).map((r) => ({ value: r.name ?? r.id, label: r.name ?? r.id }));
            setRoleOptions(opts);
        } catch (err) {
            console.error("Fetch roles error:", err);
        }
    }

    // === NEW: FETCH BRANCHES ===
    async function fetchBranches() {
        try {
            const res = await fetch(`${baseURL}/api/Branch?pageNumber=1&pageSize=100`, {
                credentials: "include"
            });

            if (!res.ok) return;

            const data = await res.json();
            const branches = data.items || [];

            const opts = branches.map((b) => ({
                value: b.branchId,
                label: b.cityName ?? `Branch ${b.branchId}`
            }));

            setBranchOptions(opts);
        } catch (err) {
            console.error("Fetch branches error:", err);
        }
    }

    // === FETCH ON PAGE CHANGE ===
    useEffect(() => {
        fetchEmployees();
    }, [currentPage, pageSize]);

    // === DEBOUNCED FILTER FETCH (UPDATED: Add selectedBranch) ===
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchEmployees();
        }, 300);

        return () => clearTimeout(searchDebounceRef.current);
    }, [nameSearch, idSearch, selectedRole, selectedBranch]);  // UPDATED: Added selectedBranch

    // === FETCH EMPLOYEES (UPDATED: Add branch filter) ===
    async function fetchEmployees() {
        setLoading(true);
        setError("");

        try {
            let url = `${baseURL}/api/Employees?pageNumber=${currentPage}&pageSize=${pageSize}`;

            if (nameSearch?.trim()) url += `&nameSearch=${encodeURIComponent(nameSearch)}`;
            if (idSearch?.trim()) url += `&idSearch=${encodeURIComponent(idSearch)}`;
            if (selectedRole?.trim()) url += `&role=${encodeURIComponent(selectedRole)}`;
            if (selectedBranch?.trim()) url += `&branchId=${encodeURIComponent(selectedBranch)}`;  // NEW: Add branch filter

            const res = await fetch(url, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map((u) => {
                return {
                    id: u.userId ?? u.user_id ?? null,
                    name: `${u.firstName ?? ""}${u.firstName && u.lastName ? " " : ""}${u.lastName ?? ""}`.trim() || u.emailAddress || "—",
                    email: u.emailAddress ?? u.email ?? "",
                    phone: u.contactNumber ?? "",
                    role: (u.role && (u.role.roleName ?? u.role.role_name)) || u.roleName || "",
                    address: formatAddress(u.address),
                    branch: u.branchCity ?? "—"
                };
            });

            setAllEmployees(mapped);
            setEmployees(mapped);

            setTotalPages(Math.max(1, Math.ceil((data.totalCount ?? mapped.length) / pageSize)));

        } catch (err) {
            console.error("Fetch employees error:", err);
            setError("Unable to load employees.");
        } finally {
            setLoading(false);
        }
    }

    function formatAddress(addr) {
        if (!addr || typeof addr !== "object") return "";

        const cityName = addr.city?.cityName ?? addr.city?.CityName ?? "";

        const parts = [];
        if (cityName) parts.push(cityName);
        if (addr.block) parts.push(`Block No. ${addr.block}`);
        if (addr.street) parts.push(`Road No. ${addr.street}`);
        if (addr.buildingNumber) parts.push(`Building No. ${addr.buildingNumber}`);

        return parts.join(" / ");
    }

    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`${baseURL}/api/Employees/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Delete failed (${res.status})`);

            setAllEmployees(prev => prev.filter(e => e.id !== deleteId));
            setEmployees(prev => prev.filter(e => e.id !== deleteId));

        } catch (err) {
            console.error("Delete employee error:", err);
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    // === VALIDATION HANDLERS ===
    function handleNameChange(e) {
        const value = e.target.value;
        if (!validNamePattern.test(value)) {
            setNameError("Only letters, spaces, dash (-), and dot (.) allowed.");
            return;
        }
        setNameError("");
        setNameSearch(value);
    }

    function handleIdChange(e) {
        const value = e.target.value;
        if (!validIdPattern.test(value)) {
            setIdError("Only numbers allowed.");
            return;
        }
        setIdError("");
        setIdSearch(value);
    }

    // TABLE CONFIG
    const columns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone Number" },
        { key: "address", label: "Address" },
        { key: "branch", label: "Branch" },
        { key: "role", label: "Role" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => <EditButton to={`/employees/edit/${row.id}`} />,
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.id);
                    setShowModal(true);
                }}
            />
        )
    };

    return (
        <div className="employees-page">
            <h2 className="text-center fw-bold employees-title">Employees</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>
                    {/* NAME SEARCH */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter employee name for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${nameError ? "is-invalid" : ""}`}
                            placeholder="Search Employee by Name"
                            value={nameSearch}
                            onChange={handleNameChange}
                        />
                        {nameError && <div className="invalid-feedback">{nameError}</div>}
                    </div>

                    {/* ID SEARCH */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter employee ID for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Employee by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />
                        {idError && <div className="invalid-feedback">{idError}</div>}
                    </div>
                </FilterLeft>

                <FilterRight>
                    <div className="d-flex gap-2">
                        {/* CLEAR BUTTON (UPDATED: Clear branch too) */}
                        <ClearButton
                            onClear={() => {
                                setNameSearch("");
                                setIdSearch("");
                                setSelectedRole("");
                                setSelectedBranch("");  // NEW: Clear branch
                                setNameError("");
                                setIdError("");

                                if (currentPage !== 1) setCurrentPage(1);
                                else fetchEmployees(1);
                            }}
                        />

                        <PageAddButton to="/employees/add" text="Add New Employee" />
                    </div>
                </FilterRight>
            </FilterSection>

            {/* ROLE & BRANCH FILTERS (UPDATED: Side by side) */}
            <FilterSection>
                <FilterLeft>
                    <div className="d-flex gap-3">
                        {/* ROLE FILTER */}
                        <div className="mb-2 flex-fill">
                            <div className="filter-label fst-italic small">Select role for automatic filter</div>
                            <FilterDropDown
                                placeholder="All roles"
                                options={roleOptions}
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            />
                        </div>

                        {/* NEW: BRANCH FILTER */}
                        <div className="mb-2 flex-fill">
                            <div className="filter-label fst-italic small">Select branch for automatic filter</div>
                            <FilterDropDown
                                placeholder="All branches"
                                options={branchOptions}
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                            />
                        </div>
                    </div>
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            {loading && <div className="text-center text-muted my-3">Loading employees...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <DataTable columns={columns} data={employees} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this employee?"
            />
        </div>
    );
}