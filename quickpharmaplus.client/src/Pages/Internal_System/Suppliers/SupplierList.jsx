import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "./SupplierList.css";

// Components
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
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
    const searchDebounceRef = useRef(null);

    // === DELETE MODAL STATE ===
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // === PAGING STATE (display 10 records per page) ===
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    const baseURL = import.meta.env.VITE_API_BASE_URL || "";

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
            setCurrentPage(1); // reset to first page when filters change
            fetchSuppliers();
        }, 300);

        return () => clearTimeout(searchDebounceRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nameSearch, idSearch]);

    // =============================================================
    // FETCH SUPPLIERS FROM API (uses single 'search' query param).
    // If nameSearch present it will be used; otherwise idSearch is used.
    // =============================================================
    async function fetchSuppliers() {
        setLoading(true);
        setError("");

        try {
            let url = `${baseURL.replace(/\/$/, "")}/api/Suppliers?pageNumber=${currentPage}&pageSize=${pageSize}`;

            // Build single 'search' param similar to server expectations:
            const search = nameSearch?.trim() || idSearch?.trim() || "";
            if (search) url += `&search=${encodeURIComponent(search)}`;

            const res = await fetch(url, { method: "GET", credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load suppliers (${res.status})`);

            const data = await res.json();

            // Support both shapes: { items, totalCount } or { Items, TotalCount } or PagedResult
            const items = data.items ?? data.Items ?? [];
            const totalCount = data.totalCount ?? data.TotalCount ?? (items.length || 0);

            // Map backend items to UI rows
            const mapped = (items || []).map((s) => {
                const rawAddress = s.address ?? s.Address ?? null;
                const addressString = typeof rawAddress === "object" && rawAddress !== null
                    ? formatAddressObj(rawAddress)
                    : (rawAddress ?? "");

                return {
                    id: s.supplierId ?? s.SupplierId ?? s.supplier_id ?? null,
                    name: s.supplierName ?? s.SupplierName ?? "—",
                    representative: s.representative ?? s.SupplierRepresentative ?? s.supplierRepresentative ?? "",
                    contact: s.contact ?? s.SupplierContact ?? s.supplierContact ?? "",
                    email: s.email ?? s.SupplierEmail ?? s.supplierEmail ?? "",
                    address: addressString,
                    products: (s.productCount ?? s.ProductCount ?? 0).toString()
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

    // =============================================================
    // DELETE CONFIRM — calls backend and removes deleted row locally
    // =============================================================
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
            // If the page is now empty and we're not on page 1, go back one page and refetch
            if (suppliers.length === 1 && currentPage > 1) {
                setCurrentPage((p) => Math.max(1, p - 1));
            } else {
                // refresh counts by re-fetching
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
    // Helper: format address to match employee list style:
    // "CityName / Block No. X / Road No. Y / Building No. Z"
    // ------------------------------
    function formatAddressObj(addr) {
        if (!addr || typeof addr !== "object") return String(addr ?? "");
        const cityName = addr.city?.cityName ?? addr.cityName ?? addr.CityName ?? "";
        const parts = [];
        if (cityName) parts.push(cityName);
        if (addr.block) parts.push(`Block No. ${addr.block}`);
        if (addr.street) parts.push(`Road No. ${addr.street}`);
        if (addr.buildingNumber) parts.push(`Building No. ${addr.buildingNumber}`);
        return parts.join(" / ");
    }

    // ------------------------------
    // TABLE COLUMNS + RENDER MAP
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
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter supplier name for automatic search</div>
                        <SearchTextField
                            placeholder="Search Supplier by Name"
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                        />
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter supplier ID for automatic search</div>
                        <SearchTextField
                            placeholder="Search Supplier by ID"
                            value={idSearch}
                            onChange={(e) => setIdSearch(e.target.value)}
                        />
                    </div>
                </FilterLeft>

                <FilterRight>
                    <PageAddButton to="/suppliers/add" text="Add New Supplier" />
                </FilterRight>
            </FilterSection>

            {/* TABLE */}
            {loading && <div className="text-center text-muted my-3">Loading suppliers...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <DataTable
                columns={columns}
                data={suppliers}
                renderMap={renderMap}
            />

            {/* PAGINATION (10 records per page) */}
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