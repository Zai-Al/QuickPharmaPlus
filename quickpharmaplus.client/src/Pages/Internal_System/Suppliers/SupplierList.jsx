import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./SupplierList.css";

// Components
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import ClearButton from "../../../Components/InternalSystem/Buttons/ClearButton";
import PageAddButton from "../../../Components/InternalSystem/Buttons/PageAddButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";
import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function SupplierList() {

    // === DATA & UI STATE ===
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // === FILTER STATE ===
    const [nameSearch, setNameSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");

    // === VALIDATION STATE ===
    const [nameError, setNameError] = useState("");
    const [idError, setIdError] = useState("");

    const validNamePattern = /^[A-Za-z\s-]*$/;
    const validIdPattern = /^[0-9]*$/;

    const searchDebounceRef = useRef(null);

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // === PAGING ===
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    const baseURL = import.meta.env.VITE_API_BASE_URL || "";

    // =========================================================
    // HANDLE VALIDATION FOR NAME
    // =========================================================
    function handleNameChange(e) {
        const value = e.target.value;
        if (!validNamePattern.test(value)) {
            setNameError("Only letters, spaces and dashes allowed.");
            return;
        }
        setNameError("");
        setNameSearch(value);
    }

    // =========================================================
    // HANDLE VALIDATION FOR ID
    // =========================================================
    function handleIdChange(e) {
        const value = e.target.value;
        if (!validIdPattern.test(value)) {
            setIdError("Only numbers allowed.");
            return;
        }
        setIdError("");
        setIdSearch(value);
    }

    // =========================================================
    // CLEAR FILTERS
    // =========================================================
    function handleClearFilters() {
        setNameSearch("");
        setIdSearch("");
        setNameError("");
        setIdError("");

        if (currentPage !== 1) setCurrentPage(1);
        else fetchSuppliers();
    }

    // ------------------------------
    // Fetch suppliers when page changes
    // ------------------------------
    useEffect(() => {
        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // ------------------------------
    // Debounced filter changes -> refetch
    // ------------------------------
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchSuppliers();
        }, 300);

        return () => clearTimeout(searchDebounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nameSearch, idSearch]);

    // =============================================================
    // FETCH SUPPLIERS
    // =============================================================
    async function fetchSuppliers() {
        setLoading(true);
        setError("");

        try {
            let url = `${baseURL.replace(/\/$/, "")}/api/Suppliers?pageNumber=${currentPage}&pageSize=${pageSize}`;

            const search = nameSearch?.trim() || idSearch?.trim() || "";
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await fetch(url, { method: "GET", credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load suppliers (${res.status})`);

            const data = await res.json();
            const items = data.items ?? data.Items ?? [];
            const totalCount = data.totalCount ?? data.TotalCount ?? (items.length || 0);

            const mapped = (items || []).map((s) => {
                const rawAddress = s.address ?? s.Address ?? null;
                const addressString =
                    typeof rawAddress === "object" && rawAddress !== null
                        ? formatAddressObj(rawAddress)
                        : (rawAddress ?? "");

                return {
                    id: s.supplierId ?? s.SupplierId ?? s.supplier_id ?? null,
                    name: s.supplierName ?? s.SupplierName ?? "—",
                    representative: s.representative ?? s.SupplierRepresentative ?? "",
                    contact: s.contact ?? s.SupplierContact ?? "",
                    email: s.email ?? s.SupplierEmail ?? "",
                    address: addressString,
                    products: (s.productCount ?? 0).toString(),
                };
            });

            setSuppliers(mapped);
            setTotalPages(Math.max(1, Math.ceil((totalCount ?? mapped.length) / pageSize)));

        } catch (err) {
            console.error("Fetch suppliers error:", err);
            setError("Unable to load suppliers.");
            setSuppliers([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }

    // ------------------------------
    // Helper: format address
    // ------------------------------
    function formatAddressObj(addr) {
        if (!addr || typeof addr !== "object") return String(addr ?? "");
        const cityName = addr.city?.cityName ?? addr.cityName ?? "";
        const parts = [];
        if (cityName) parts.push(cityName);
        if (addr.block) parts.push(`Block No. ${addr.block}`);
        if (addr.street) parts.push(`Road No. ${addr.street}`);
        if (addr.buildingNumber) parts.push(`Building No. ${addr.buildingNumber}`);
        return parts.join(" / ");
    }

    // ------------------------------
    // DELETE SUPPLIER
    // ------------------------------
    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`${baseURL.replace(/\/$/, "")}/api/Suppliers/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Delete failed (${res.status})`);

            setSuppliers((prev) => prev.filter((s) => s.id !== deleteId));

            if (suppliers.length === 1 && currentPage > 1) {
                setCurrentPage((p) => Math.max(1, p - 1));
            } else {
                fetchSuppliers();
            }
        } catch (err) {
            console.error("Delete supplier error:", err);
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    // ------------------------------
    // TABLE COLUMNS
    // ------------------------------
    const columns = [
        { key: "name", label: "Name" },
        { key: "representative", label: "Representative" },
        { key: "contact", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "address", label: "Address" },
        { key: "products", label: "Number of Products" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => <EditButton to={`/supplier/edit/${row.id}`} />,
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
        <div className="suppliers-page">
            <h2 className="text-center fw-bold suppliers-title">Suppliers</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>

                    {/* NAME FILTER */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter supplier name for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${nameError ? "is-invalid" : ""}`}
                            placeholder="Search Supplier by Name"
                            value={nameSearch}
                            onChange={handleNameChange}
                        />

                        <div style={{ height: "20px" }}>
                            {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                        </div>
                    </div>

                    {/* ID FILTER */}
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter supplier ID for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Supplier by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />

                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>

                </FilterLeft>

                <FilterRight>
                    <ClearButton onClear={handleClearFilters} />
                    <PageAddButton to="/suppliers/add" text="Add New Supplier" />
                </FilterRight>
            </FilterSection>

            {/* TABLE */}
            {loading && <div className="text-center text-muted my-3">Loading suppliers...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <DataTable columns={columns} data={suppliers} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
            />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this supplier record?"
            />
        </div>
    );
}
