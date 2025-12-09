import { useEffect, useState, useRef } from "react";
import "./EmployeesList.css";

// Components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
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
    const searchDebounceRef = useRef(null);

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // === PAGING STATE ===
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // === INITIAL: fetch roles once ===
    useEffect(() => { fetchRoles(); }, []);

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

    // === WHEN PAGE NUMBER OR PAGE SIZE CHANGES, FETCH DATA ===
    useEffect(() => {
        fetchEmployees();
    }, [currentPage, pageSize]);

    // === FILTERS: Debounced Backend Call ===
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);          // reset paging
            fetchEmployees();           // refetch from backend with filters
        }, 300);

        return () => clearTimeout(searchDebounceRef.current);
    }, [nameSearch, idSearch, selectedRole]);

    // === FETCH EMPLOYEES FROM API USING FILTERS ===
    async function fetchEmployees() {
        setLoading(true);
        setError("");

        try {
            let url = `${baseURL}/api/Employees/employees?pageNumber=${currentPage}&pageSize=${pageSize}`;

            if (nameSearch?.trim()) url += `&nameSearch=${encodeURIComponent(nameSearch)}`;
            if (idSearch?.trim()) url += `&idSearch=${encodeURIComponent(idSearch)}`;
            if (selectedRole?.trim()) url += `&role=${encodeURIComponent(selectedRole)}`;

            const res = await fetch(url, {
                method: "GET",
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);

            const data = await res.json();

            // Mapping from backend data to UI-friendly format
            const mapped = (data.items || []).map((u) => {
                const address = u.address ?? null;
                return {
                    id: u.userId ?? u.user_id ?? null,
                    name: `${u.firstName ?? ""}${u.firstName && u.lastName ? " " : ""}${u.lastName ?? ""}`.trim() || u.emailAddress || "—",
                    email: u.emailAddress ?? u.email ?? "",
                    phone: u.contactNumber ?? "",
                    role: (u.role && (u.role.roleName ?? u.role.role_name)) || u.roleName || "",
                    address: formatAddress(address)
                };
            });

            // store raw result for UI use
            setAllEmployees(mapped);
            setEmployees(mapped);

            // Backend now returns correct filtered count
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
        const cityName = addr.city?.cityName ?? addr.cityName ?? addr.city?.CityName ?? "";
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

            setAllEmployees((prev) => prev.filter((e) => e.id !== deleteId));
            setEmployees((prev) => prev.filter((e) => e.id !== deleteId));

        } catch (err) {
            console.error("Delete employee error:", err);
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    // Table columns
    const columns = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone Number" },
        { key: "address", label: "Address" },
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
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter employee name for automatic search</div>
                        <SearchTextField
                            placeholder="Search Employee by Name"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                        />
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter employee ID for automatic search</div>
                        <SearchTextField
                            placeholder="Search Employee by ID"
                            value={idSearch}
                            onChange={(e) => setIdSearch(e.target.value)}
                        />
                    </div>
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/employees/add" text="Add New Employee" />
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select role for automatic filter</div>
                        <FilterDropDown
                            placeholder="All roles"
                            options={roleOptions}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        />
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
