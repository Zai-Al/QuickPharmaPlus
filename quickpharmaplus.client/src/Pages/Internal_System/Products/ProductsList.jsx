import { useEffect, useState, useRef } from "react";
import "./ProductsList.css";

// Reusable Components
import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../Components/InternalSystem/Buttons/ClearButton";
import PageAddButton from "../../../Components/InternalSystem/Buttons/PageAddButton";
import ViewButton from "../../../Components/InternalSystem/Buttons/ViewButton";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";
import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";

export default function ProductsList() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || "";

    // DATA + UI STATE
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // FILTER STATE
    const [nameSearch, setNameSearch] = useState("");
    const [idSearch, setIdSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);

    // Validation state
    const [nameError, setNameError] = useState("");
    const [idError, setIdError] = useState("");
    const [supplierError, setSupplierError] = useState("");
    const [categoryError, setCategoryError] = useState("");

    // Patterns
    const validNamePattern = /^[A-Za-z0-9 .\-+]*$/;
    const validIdPattern = /^[0-9]*$/;
    const validSupplierPattern = /^[A-Za-z\s-]*$/; // letters spaces dashes
    const validCategoryPattern = /^[A-Za-z\s]*$/;  // letters + spaces only

    // SEARCHABLE DROPDOWN STATE
    const [supplierQuery, setSupplierQuery] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    // changed initial index to -1 so no item is "active" by default
    const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(-1);
    const supplierRef = useRef(null);

    const [categoryQuery, setCategoryQuery] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    // also use -1 for category highlight
    const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(-1);
    const categoryRef = useRef(null);

    const searchDebounceRef = useRef(null);

    // DELETE MODAL STATE
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Paging
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    // Fetch dropdowns
    useEffect(() => {
        fetchSuppliersForFilter();
        fetchCategoriesForFilter();
    }, []);

    // Fetch products when page changes
    useEffect(() => {
        fetchProducts();
    }, [currentPage]);

    // Debounced refetch
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchProducts(1);
        }, 300);
        return () => clearTimeout(searchDebounceRef.current);
    }, [nameSearch, idSearch, selectedSupplier, selectedCategory]);

    // Sync dropdown query with selected value
    useEffect(() => {
        if (selectedSupplier) {
            setSupplierQuery(selectedSupplier.supplierName ?? "");
        }
    }, [selectedSupplier]);


    useEffect(() => {
        setCategoryQuery(selectedCategory ? selectedCategory.categoryName ?? "" : "");
    }, [selectedCategory]);

    // Close supplier dropdown outside click
    useEffect(() => {
        const handler = (e) => {
            if (supplierRef.current && !supplierRef.current.contains(e.target)) {
                setShowSupplierDropdown(false);
                // reset to -1 so no default is highlighted
                setSupplierHighlightIndex(-1);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close category dropdown outside click
    useEffect(() => {
        const handler = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
                // reset to -1 so no default is highlighted
                setCategoryHighlightIndex(-1);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    async function fetchSuppliersForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/Suppliers?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const items = data.items ?? [];
            setSupplierOptions(items.map(s => ({
                supplierId: s.supplierId ?? null,
                supplierName: s.supplierName ?? "—"
            })));
        } catch { }
    }

    async function fetchCategoriesForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/Category?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const items = data.items ?? [];
            setCategoryOptions(items.map(c => ({
                categoryId: c.categoryId ?? null,
                categoryName: c.categoryName ?? "—"
            })));
        } catch { }
    }

    async function fetchProducts(page = currentPage) {
        setLoading(true);
        setError("");
        try {
            const params = new URLSearchParams();
            params.set("pageNumber", page);
            params.set("pageSize", pageSize);

            if (nameSearch?.trim() || idSearch?.trim())
                params.set("search", nameSearch || idSearch);

            if (selectedSupplier) params.set("supplierId", selectedSupplier.supplierId);
            if (selectedCategory) params.set("categoryId", selectedCategory.categoryId);

            const res = await fetch(`${baseURL}/api/Products?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error();

            const data = await res.json();
            const items = data.items ?? [];

            setProducts(items.map(p => ({
                id: p.productId,
                name: p.productName,
                category: p.categoryName,
                supplier: p.supplierName,
                price: (p.productPrice ?? 0).toString(),
                controlled: p.isControlled ? "Yes" : "No"
            })));

            const totalCount = data.totalCount ?? items.length;
            setTotalPages(Math.max(1, Math.ceil(totalCount / pageSize)));
            setCurrentPage(page);
        } catch {
            setError("Unable to load products.");
        } finally {
            setLoading(false);
        }
    }

    // Validation handlers
    function handleNameChange(e) {
        const value = e.target.value;
        if (!validNamePattern.test(value)) {
            setNameError("Letters, numbers, +, -, space allowed.");
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

    function handleSupplierTextChange(e) {
        const value = e.target.value;
        if (!validSupplierPattern.test(value)) {
            setSupplierError("Only letters, spaces and - allowed.");
            return;
        }
        setSupplierError("");
        setSupplierQuery(value);
    }

    function handleCategoryTextChange(e) {
        const value = e.target.value;
        if (!validCategoryPattern.test(value)) {
            setCategoryError("Only letters and spaces allowed.");
            return;
        }
        setCategoryError("");
        setCategoryQuery(value);
    }

    // Supplier filtering
    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter(s =>
            s.supplierName.toLowerCase().includes(supplierQuery.toLowerCase())
        )
        : supplierOptions;

    // Clear button
    function handleClearFilters() {
        setNameSearch("");
        setIdSearch("");
        setSelectedSupplier(null);
        setSelectedCategory(null);
        setSupplierQuery("");
        setCategoryQuery("");
        setNameError("");
        setIdError("");
        setSupplierError("");
        setCategoryError("");

        if (currentPage !== 1) setCurrentPage(1);
        else fetchProducts(1);
    }

    async function handleDeleteConfirm() {
        if (!deleteId) return setShowModal(false);
        try {
            await fetch(`${baseURL}/api/Products/${deleteId}`, {
                method: "DELETE",
                credentials: "include"
            });
            fetchProducts();
        } finally {
            setDeleteId(null);
            setShowModal(false);
        }
    }

    const columns = [
        { key: "name", label: "Product Name" },
        { key: "category", label: "Category" },
        { key: "supplier", label: "Supplier" },
        { key: "price", label: "Unit Price" },
        { key: "controlled", label: "Control" },
        { key: "view", label: "View Details" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        view: (row) => <ViewButton to={`/products/view/${row.id}`} text="View Details" />,
        edit: (row) => <EditButton to={`/product/edit/${row.id}`} />,
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
        <div className="products-page">
            <h2 className="text-center fw-bold mt-5 mb-4">Products</h2>

            {/* FILTERS */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter product name for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${nameError ? "is-invalid" : ""}`}
                            placeholder="Search Product by Name"
                            value={nameSearch}
                            onChange={handleNameChange}
                        />
                        <div style={{ height: "20px" }}>
                            {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                        </div>
                    </div>

                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter product ID for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Product by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />
                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>
                </FilterLeft>

                <FilterRight>
                    <div className="d-flex gap-2">
                        <ClearButton onClear={handleClearFilters} />
                        <PageAddButton to="/product/add" text="Add New Product" />
                    </div>
                </FilterRight>
            </FilterSection>

            {/* DROPDOWNS SECTION */}
            <FilterSection>
                <FilterLeft>
                    {/* Supplier dropdown */}
                    <div className="mb-2" ref={supplierRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Filter by supplier</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input  ${supplierError ? "is-invalid" : ""}`}
                            placeholder="Search or select supplier"
                            value={supplierQuery}
                            onChange={(e) => {
                                handleSupplierTextChange(e);
                                // ensure no default highlight when opening
                                setSupplierHighlightIndex(-1);
                                setShowSupplierDropdown(true);
                            }}
                            onFocus={() => {
                                setSupplierHighlightIndex(-1);
                                setShowSupplierDropdown(true);
                            }}
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {supplierError && <div className="invalid-feedback d-block">{supplierError}</div>}
                        </div>

                        {showSupplierDropdown && filteredSuppliers.length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredSuppliers.map((s, idx) => (
                                    <li
                                        key={s.supplierId}
                                        className={`list-group-item list-group-item-action ${idx === supplierHighlightIndex ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedSupplier(s);
                                            setSupplierQuery(s.supplierName);
                                            setShowSupplierDropdown(false);
                                            // set highlight to selected item index (optional)
                                            setSupplierHighlightIndex(idx);
                                        }}
                                    >
                                        {s.supplierName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Category dropdown */}
                    <div className="mb-2" ref={categoryRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Filter by category</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${categoryError ? "is-invalid" : ""}`}
                            placeholder="Search or select category"
                            value={categoryQuery}
                            onChange={(e) => {
                                handleCategoryTextChange(e);
                                // ensure no default highlight when opening
                                setCategoryHighlightIndex(-1);
                                setShowCategoryDropdown(true);
                            }}
                            onFocus={() => {
                                setCategoryHighlightIndex(-1);
                                setShowCategoryDropdown(true);
                            }}   // ADDED
                            autoComplete="off"
                        />

                        <div style={{ height: "20px" }}>
                            {categoryError && <div className="invalid-feedback d-block">{categoryError}</div>}
                        </div>

                        {showCategoryDropdown && categoryOptions.length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {categoryOptions
                                    .filter(c => c.categoryName.toLowerCase().includes(categoryQuery.toLowerCase()))
                                    .map(c => (
                                        <li
                                            key={c.categoryId}
                                            className="list-group-item list-group-item-action"
                                            onClick={() => {
                                                setSelectedCategory(c);
                                                setCategoryQuery(c.categoryName);
                                                setShowCategoryDropdown(false);
                                                setCategoryHighlightIndex(-1);
                                            }}
                                        >
                                            {c.categoryName}
                                        </li>
                                    ))}
                            </ul>
                        )}
                    </div>
                </FilterLeft>
            </FilterSection>

            {/* TABLE */}
            {loading && <div className="text-center text-muted my-3">Loading products...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <DataTable columns={columns} data={products} renderMap={renderMap} />

            {/* PAGINATION */}
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            {/* DELETE MODAL */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this product?"
            />
        </div>
    );
}