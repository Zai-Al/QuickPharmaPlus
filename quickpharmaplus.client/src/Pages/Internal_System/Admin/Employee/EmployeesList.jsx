import { useEffect, useState } from "react";
import "./EmployeesList.css";

// Components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";

export default function EmployeesList() {

    // === DATA & UI STATE ===
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // === PAGING STATE ===
    const [currentPage, setCurrentPage] = useState(1);   // page number
    const [pageSize, setPageSize] = useState(10);         // records per page
    const [totalPages, setTotalPages] = useState(1);     // computed from backend

    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // === WHEN PAGE NUMBER OR PAGE SIZE CHANGES, FETCH DATA ===
    useEffect(() => {
        fetchEmployees();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, pageSize]);

    // === FETCH EMPLOYEES FROM API WITH PAGING ===
    async function fetchEmployees() {
        setLoading(true);
        setError("");

        try {
            const res = await fetch(
                `${baseURL}/api/Employees/employees?pageNumber=${currentPage}&pageSize=${pageSize}`,
                {
                    method: "GET",
                    credentials: "include"
                }
            );

            if (!res.ok) {
                throw new Error(`Failed to load employees (${res.status})`);
            }

            const data = await res.json();

            // PAGED RESPONSE: data.items + data.totalCount
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

            setEmployees(mapped);

            // Compute number of pages
            setTotalPages(Math.ceil(data.totalCount / pageSize));

        } catch (err) {
            console.error("Fetch employees error:", err);
            setError("Unable to load employees.");
        } finally {
            setLoading(false);
        }
    }

    function formatAddress(addr) {
        if (!addr) return "";
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

            if (!res.ok) {
                throw new Error(`Delete failed (${res.status})`);
            }

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
            {/* TITLE */}
            <h2 className="text-center fw-bold employees-title">Employees</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>
                    <SearchTextField placeholder="Search Employee by Name" />
                    <SearchTextField placeholder="Search Employee by ID" />
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/employees/add" text="Add New Employee" />
                </FilterRight>
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
