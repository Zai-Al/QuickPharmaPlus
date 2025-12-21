import { useEffect, useState, useRef } from "react";
import "./InventoryList.css";

// Shared components
import DataTable from "../../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../../Components/InternalSystem/Buttons/ClearButton";
import PageAddButton from "../../../../Components/InternalSystem/Buttons/PageAddButton";

import FilterSection from "../../../../Components/InternalSystem/GeneralComponents/FilterSection";
import FilterLeft from "../../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../../Components/InternalSystem/GeneralComponents/FilterRight";
import SearchTextField from "../../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import DatePicker from "../../../../Components/InternalSystem/GeneralComponents/DatePicker";
import Pagination from "../../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../../Components/InternalSystem/Modals/DeleteModal";
import FilterDropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropdown";

export default function InventoryList() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // UI / data state
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [inventories, setInventories] = useState([]);
    const [totalPages, setTotalPages] = useState(1);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Filters
    const [idSearch, setIdSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productOptions, setProductOptions] = useState([]);
    const [filterExpiryDate, setFilterExpiryDate] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [branchOptions, setBranchOptions] = useState([]);

    // SEARCHABLE PRODUCT DROPDOWN STATE
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productHighlightIndex, setProductHighlightIndex] = useState(0);
    const productRef = useRef(null);

    const [showModal, setShowModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const filterDebounceRef = useRef(null);

    // NEW — validation states
    const [idError, setIdError] = useState("");
    const [productError, setProductError] = useState("");

    const columns = [
        { key: "inventoryId", label: "Inventory ID" },
        { key: "productName", label: "Product Name" },
        { key: "quantity", label: "Quantity" },
        { key: "expiryDate", label: "Expiry Date" },
        { key: "branchAddress", label: "Branch Address" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => <EditButton to={`/inventory/edit/${row.inventoryId}`} />,
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.inventoryId);
                    setShowModal(true);
                }}
            />
        )
    };

    function formatDate(dateValue) {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    useEffect(() => {
        fetchProductsForFilter();
        fetchBranchesForFilter();
    }, []);

    useEffect(() => {
        fetchInventories(currentPage);
    }, [currentPage]);

    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            if (currentPage !== 1) setCurrentPage(1);
            else fetchInventories(1);
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
    }, [idSearch, selectedProduct, filterExpiryDate, pageSize, selectedBranch]);

    useEffect(() => {
        if (selectedProduct) {
            setProductQuery(selectedProduct.productName ?? "");
        } else {
            setProductQuery("");
        }
    }, [selectedProduct]);

    useEffect(() => {
        const onDocClick = (e) => {
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductDropdown(false);
                setProductHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    async function fetchProductsForFilter() {
        try {
            const res = await fetch(`${baseURL.replace(/\/$/, "")}/api/Products?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) return setProductOptions([]);
            const data = await res.json();
            const items = data.items ?? data.Items ?? [];
            const opts = (items || []).map(p => ({
                productId: p.productId ?? p.ProductId ?? null,
                productName: p.productName ?? p.ProductName ?? "—"
            }));
            setProductOptions(opts);
        } catch {
            setProductOptions([]);
        }
    }

    async function fetchBranchesForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/Branch?pageNumber=1&pageSize=100`, { credentials: "include" });
            if (!res.ok) return setBranchOptions([]);
            const data = await res.json();
            const branches = data.items || [];
            setBranchOptions(branches.map(b => ({
                value: b.branchId,
                label: b.cityName ?? `Branch ${b.branchId}`
            })));
        } catch {
            setBranchOptions([]);
        }
    }

    async function fetchInventories(pageNumber = 1) {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", String(pageNumber));
            params.set("pageSize", String(pageSize));

            if (selectedProduct && selectedProduct.productName) {
                params.set("search", selectedProduct.productName);
            } else if (idSearch && idSearch.trim()) {
                params.set("search", idSearch.trim());
            }

            if (filterExpiryDate) {
                const raw = filterExpiryDate;
                params.set("expiryDate", `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`);
            }

            if (selectedBranch && selectedBranch !== "") {
                params.set("branchId", selectedBranch); // Send branchId
            }

            const res = await fetch(`${baseURL}/api/Inventory?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load inventory (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map((i) => ({
                inventoryId: i.inventoryId ?? i.inventory_id ?? null,
                productName: i.productName ?? i.product?.productName ?? "",
                quantity: i.quantity ?? i.inventoryQuantity ?? 0,
                expiryDate: formatDate(i.expiryDate),
                branchAddress: formatAddress(i.address)
            }));

            setInventories(mapped);

            const totalCount = data.totalCount ?? mapped.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));

        } catch {
            setError("Unable to load inventory records.");
        } finally {
            setLoading(false);
        }
    }

    // VALIDATION RULE — allowed product characters
    const isValidProductInput = (val) =>
        /^[A-Za-z0-9+\- ]*$/.test(val);

    // UPDATED FILTERING LOGIC — prefix matching
    const filteredProducts = (productQuery ?? "")
        ? (productOptions || []).filter(p =>
            String(p.productName ?? "").toLowerCase().startsWith(String(productQuery).toLowerCase())
        )
        : productOptions;

    const handleProductInputChange = (e) => {
        const val = e.target.value;

        if (!isValidProductInput(val)) {
            setProductError("Only letters, numbers, spaces, - and + allowed.");
        } else {
            setProductError("");
            setProductQuery(val);
            setShowProductDropdown(true);
            setProductHighlightIndex(0);
            if (!val) setSelectedProduct(null);
        }
    };

    const handleProductInputFocus = () => {
        setShowProductDropdown(true);
        setProductHighlightIndex(0);
    };

    const handleProductKeyDown = (e) => {
        if (!showProductDropdown) return;
        const list = filteredProducts || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setProductHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setProductHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[productHighlightIndex];
            if (picked) handleSelectProduct(picked);
        } else if (e.key === "Escape") {
            setShowProductDropdown(false);
        }
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductQuery(product.productName ?? "");
        setShowProductDropdown(false);
        setProductHighlightIndex(0);
    };

    // LIVE VALIDATION FOR INVENTORY ID (NUMBERS ONLY)
    const handleIdChange = (e) => {
        const val = e.target.value;

        if (/^[0-9]*$/.test(val)) {
            setIdError("");
            setIdSearch(val);
        } else {
            setIdError("Only numbers allowed.");
        }
    };

    function formatAddress(addr) {
        if (!addr || typeof addr !== "object") return "";
        return addr.city?.cityName ?? addr.cityName ?? addr.city?.CityName ?? "";
    }

    // =================== DELETE HANDLER ===================
    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            const res = await fetch(`${baseURL}/api/Inventory/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `Delete failed (${res.status})`);
            }

            // Show success message
            const responseData = await res.json();
            setSuccessMessage(responseData.message || "Inventory record deleted successfully!");
            setError("");

            // Remove deleted item from the list
            setInventories(prev => prev.filter(i => i.inventoryId !== deleteId));

            // Hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage("");
            }, 3000);

        } catch (err) {
            console.error("Delete inventory error:", err);
            setError(err.message || "Failed to delete inventory record.");
            setSuccessMessage("");
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    return (
        <div className="inventory-page">
            <h2 className="text-center fw-bold inventory-title">Inventory</h2>

            {/* SUCCESS MESSAGE */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible w-50" style={{margin: "20px auto" }}>
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="alert alert-danger alert-dismissible w-50" style={{margin: "20px auto" }}>
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setError("")}></button>
                    <strong>Error!</strong> {error}
                </div>
            )}

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter inventory id for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Inventory Record by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />

                        {/* Reserved space for error display */}
                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>


                    <div className="mb-2" ref={productRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select product for automatic search</div>

                        <input
                            type="text"
                            className={`form-control filter-text-input ${productError ? "is-invalid" : ""}`}
                            placeholder={productOptions.length === 0 ? "Loading products..." : "Search or select product"}
                            value={productQuery ?? ""}
                            onChange={handleProductInputChange}
                            onFocus={handleProductInputFocus}
                            onKeyDown={handleProductKeyDown}
                            disabled={productOptions.length === 0}
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {productError && <div className="invalid-feedback d-block">{productError}</div>}
                        </div>

                        {showProductDropdown && (filteredProducts || []).length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredProducts.map((p, idx) => (
                                    <li
                                        key={p.productId}
                                        className={`list-group-item list-group-item-action ${idx === productHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectProduct(p)}
                                        onMouseEnter={() => setProductHighlightIndex(idx)}
                                    >
                                        {p.productName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </FilterLeft>

                <FilterRight>
                    <div className="d-flex gap-2">
                        <ClearButton
                            onClear={() => {
                                setIdSearch("");
                                setSelectedProduct(null);
                                setProductQuery("");
                                setFilterExpiryDate(null);
                                setIdError("");
                                setProductError("");
                                setSelectedBranch(""); // Reset branch selection

                                if (currentPage !== 1) setCurrentPage(1);
                                else fetchInventories(1);
                            }}
                        />

                        <PageAddButton to="/inventory/add" text="Add New Inventory" />
                    </div>
                </FilterRight>
            </FilterSection>

            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select branch for automatic search</div>
                        <FilterDropdown
                            placeholder="Filter Inventory by Branch"
                            options={branchOptions}
                            value={selectedBranch || ""}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value); // This is the branchId
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select expiry date for automatic search</div>
                        <DatePicker
                            selected={filterExpiryDate}
                            onChange={(d) => setFilterExpiryDate(d)}
                            placeholderText="Filter Inventory Records by Expiry Date"
                        />
                    </div>
                </FilterLeft>
            </FilterSection>

            {loading && <div className="text-center text-muted my-3">Loading inventory...</div>}

            <DataTable columns={columns} data={inventories} renderMap={renderMap} />

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />

            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this inventory record?"
            />
        </div>
    );
}
