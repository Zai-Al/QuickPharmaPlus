import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./OrdersList.css";

import DataTable from "../../../Components/InternalSystem/Table/DataTable";
import EditButton from "../../../Components/InternalSystem/Buttons/EditButton";
import PageAddButton from "../../../Components/InternalSystem/Buttons/PageAddButton";
import DeleteButton from "../../../Components/InternalSystem/Buttons/DeleteButton";
import ClearButton from "../../../Components/InternalSystem/Buttons/ClearButton";
import DeleteModal from "../../../Components/InternalSystem/Modals/DeleteModal";

import SearchTextField from "../../../Components/InternalSystem/GeneralComponents/FilterTextField";
import FilterDropdown from "../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import DataPicker from "../../../Components/InternalSystem/GeneralComponents/DatePicker";
import FilterRight from "../../../Components/InternalSystem/GeneralComponents/FilterRight";
import FilterLeft from "../../../Components/InternalSystem/GeneralComponents/FilterLeft";
import FilterSection from "../../../Components/InternalSystem/GeneralComponents/FilterSection";

import Pagination from "../../../Components/InternalSystem/GeneralComponents/Pagination";

export default function OrdersList() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const location = useLocation();
    const navigate = useNavigate();

    /* ----------------------------------------- */
    /*          LOCAL STATE FOR TABS              */
    /* ----------------------------------------- */
    const [isReorderPage, setIsReorderPage] = useState(false);

    /* ----------------------------------------- */
    /*     ACTIVATE REORDER TAB IF URL MATCHES    */
    /* ----------------------------------------- */
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get("tab");

        if (tab === "reorder") {
            setIsReorderPage(true);
        }
    }, [location]);

    /* ----------------------------------------- */
    /*            DATA & UI STATE                 */
    /* ----------------------------------------- */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [supplierOrders, setSupplierOrders] = useState([]);
    const [reorders, setReorders] = useState([]);

    // Store all fetched data before client-side filtering
    const [allSupplierOrders, setAllSupplierOrders] = useState([]);
    const [allReorders, setAllReorders] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPages, setTotalPages] = useState(1);

    /* ----------------------------------------- */
    /*            DELETE + FILTER STATE           */
    /* ----------------------------------------- */
    const [deleteId, setDeleteId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Filters
    const [idSearch, setIdSearch] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedType, setSelectedType] = useState("");
    const [filterDate, setFilterDate] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState("");

    // Dropdown options
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [employeeOptions, setEmployeeOptions] = useState([]);
    const [statusOptions, setStatusOptions] = useState([]);
    const [typeOptions, setTypeOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    // Searchable dropdown states - Supplier
    const [supplierQuery, setSupplierQuery] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(-1);
    const supplierRef = useRef(null);

    // Searchable dropdown states - Product
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productHighlightIndex, setProductHighlightIndex] = useState(-1);
    const productRef = useRef(null);

    // Searchable dropdown states - Employee
    const [employeeQuery, setEmployeeQuery] = useState("");
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
    const [employeeHighlightIndex, setEmployeeHighlightIndex] = useState(-1);
    const employeeRef = useRef(null);

    // Validation errors
    const [idError, setIdError] = useState("");
    const [supplierError, setSupplierError] = useState("");
    const [productError, setProductError] = useState("");
    const [employeeError, setEmployeeError] = useState("");

    const filterDebounceRef = useRef(null);

    /* ----------------------------------------- */
    /*          VALIDATION PATTERNS              */
    /* ----------------------------------------- */
    const validIdPattern = /^[0-9]*$/;
    const validNamePattern = /^[A-Za-z0-9 .\-+]*$/;
    const validSupplierPattern = /^[A-Za-z\s-]*$/;
    const validEmployeePattern = /^[A-Za-z .-]*$/;

    /* ----------------------------------------- */
    /*               TABLE COLUMNS               */
    /* ----------------------------------------- */
    const orderColumns = [
        { key: "supplier", label: "Supplier Name" },
        { key: "product", label: "Product Name" },
        { key: "employee", label: "Employee Name" },
        { key: "branch", label: "Branch" },
        { key: "date", label: "Order Date" },
        { key: "quantity", label: "Quantity" },
        { key: "type", label: "Type" },
        { key: "status", label: "Status" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const reorderColumns = [
        { key: "product", label: "Product Name" },
        { key: "supplier", label: "Supplier Name" },
        { key: "employee", label: "Employee Name" },
        { key: "branch", label: "Branch" },
        { key: "threshold", label: "Threshold" },
        { key: "edit", label: "Edit" },
        { key: "delete", label: "Delete" }
    ];

    const renderMap = {
        edit: (row) => (
            <EditButton
                to={isReorderPage ? `/reorders/edit/${row.id}` : `/orders/edit/${row.id}`}
            />
        ),
        delete: (row) => (
            <DeleteButton
                onClick={() => {
                    setDeleteId(row.id);
                    setShowModal(true);
                }}
            />
        )
    };

    /* ----------------------------------------- */
    /*          FETCH DROPDOWN OPTIONS           */
    /* ----------------------------------------- */
    useEffect(() => {
        fetchSuppliersForFilter();
        fetchProductsForFilter();
        fetchEmployeesForFilter();
        fetchStatusesForFilter();
        fetchTypesForFilter();
        fetchBranchesForFilter();
    }, []);

    /* ----------------------------------------- */
    /*    INITIAL FETCH ON TAB/PAGE CHANGE       */
    /* ----------------------------------------- */
    useEffect(() => {
        // Reset to page 1 when switching tabs
        setCurrentPage(1);

        if (isReorderPage) {
            fetchReorders();
        } else {
            fetchSupplierOrders();
        }
    }, [isReorderPage]);

    /* ----------------------------------------- */
    /*    APPLY FILTERS & PAGINATION             */
    /* ----------------------------------------- */
    useEffect(() => {
        if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);

        filterDebounceRef.current = setTimeout(() => {
            applyFiltersAndPagination();
        }, 300);

        return () => clearTimeout(filterDebounceRef.current);
    }, [idSearch, selectedSupplier, selectedProduct, selectedEmployee, selectedStatus, selectedType, filterDate, currentPage, isReorderPage, allSupplierOrders, allReorders, selectedBranch]);

    /* ----------------------------------------- */
    /*     SYNC DROPDOWN QUERIES WITH SELECTION  */
    /* ----------------------------------------- */
    useEffect(() => {
        setSupplierQuery(selectedSupplier ? selectedSupplier.supplierName ?? "" : "");
    }, [selectedSupplier]);

    useEffect(() => {
        setProductQuery(selectedProduct ? selectedProduct.productName ?? "" : "");
    }, [selectedProduct]);

    useEffect(() => {
        setEmployeeQuery(selectedEmployee ? selectedEmployee.employeeFullName ?? "" : "");
    }, [selectedEmployee]);

    /* ----------------------------------------- */
    /*    CLOSE DROPDOWNS ON OUTSIDE CLICK       */
    /* ----------------------------------------- */
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (supplierRef.current && !supplierRef.current.contains(e.target)) {
                setShowSupplierDropdown(false);
                setSupplierHighlightIndex(-1);
            }
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductDropdown(false);
                setProductHighlightIndex(-1);
            }
            if (employeeRef.current && !employeeRef.current.contains(e.target)) {
                setShowEmployeeDropdown(false);
                setEmployeeHighlightIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    /* ----------------------------------------- */
    /*          FETCH FUNCTIONS                  */
    /* ----------------------------------------- */
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
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setError(`An error occurred while loading suppliers: ${err.message}`);
        }
    }

    async function fetchProductsForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/Products?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const items = data.items ?? [];
            setProductOptions(items.map(p => ({
                productId: p.productId ?? null,
                productName: p.productName ?? "—"
            })));
        } catch (err) {
            console.error("Error fetching products:", err);
            setError(`An error occurred while loading products: ${err.message}`);
        }
    }

    async function fetchEmployeesForFilter() {
        try {
            // FIXED: Changed from /api/Employees/employees to /api/Employees
            const res = await fetch(`${baseURL}/api/Employees?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const items = data.items ?? [];
            setEmployeeOptions(items.map(e => ({
                employeeId: e.userId,  // Make sure this matches the DTO structure
                employeeFullName: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || "—"
            })));
        } catch (err) {
            console.error("Error fetching employees:", err);
            setError(`An error occurred while loading employees: ${err.message}`);
        }
    }

    async function fetchStatusesForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/SupplierOrder/statuses`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            setStatusOptions(data.map(s => ({
                value: s.statusId ?? null,
                label: s.statusType ?? "—"
            })));
        } catch (err) {
            console.error("Error fetching statuses:", err);
            setError(`An error occurred while loading statuses: ${err.message}`);
        }
    }

    async function fetchTypesForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/SupplierOrder/types`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            setTypeOptions(data.map(t => ({
                value: t.typeId ?? null,
                label: t.typeName ?? "—"
            })));
        } catch (err) {
            console.error("Error fetching types:", err);
            setError(`An error occurred while loading order types: ${err.message}`);
        }
    }

    async function fetchBranchesForFilter() {
        try {
            const res = await fetch(`${baseURL}/api/Branch?pageNumber=1&pageSize=100`, { credentials: "include" });
            if (!res.ok) return;
            const data = await res.json();
            const branches = data.items || [];
            setBranchOptions(branches.map(b => ({
                value: b.branchId,
                label: b.cityName ?? `Branch ${b.branchId}`
            })));
        } catch (err) {
            console.error("Error fetching branches:", err);
            setError(`An error occurred while loading branches: ${err.message}`);
        }
    }

    async function fetchSupplierOrders() {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", "1");
            params.set("pageSize", "1000"); // Fetch more records to handle client-side filtering

            if (idSearch?.trim()) {
                params.set("search", idSearch.trim());
            }

            // Add date filter in the format the backend expects (similar to Inventory)
            if (filterDate) {
                const raw = filterDate;
                params.set("orderDate", `${raw.getFullYear()}-${String(raw.getMonth() + 1).padStart(2, "0")}-${String(raw.getDate()).padStart(2, "0")}`);
            }

            const res = await fetch(`${baseURL}/api/SupplierOrder?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load supplier orders (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map(o => ({
                id: o.supplierOrderId ?? null,
                supplierId: o.supplierId,
                supplier: o.supplierName ?? "—",
                productId: o.productId,
                product: o.productName ?? "—",
                employeeId: o.employeeId,
                employee: o.employeeFullName ?? "—",
                branchId: o.branchId,
                branch: o.branchName ?? "—",
                date: formatDate(o.supplierOrderDate),
                quantity: o.supplierOrderQuantity ?? 0,
                supplierOrderTypeId: o.supplierOrderTypeId,
                type: o.supplierOrderTypeName ?? "—",
                supplierOrderStatusId: o.supplierOrderStatusId,
                status: o.supplierOrderStatusType ?? "—"
            }));

            setAllSupplierOrders(mapped);

        } catch (err) {
            console.error("Error fetching supplier orders:", err);
            setError(`An error occurred while loading supplier orders: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    async function fetchReorders() {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams();
            params.set("pageNumber", "1");
            params.set("pageSize", "1000"); // Fetch more records

            if (idSearch?.trim()) {
                params.set("search", idSearch.trim());
            }

            const res = await fetch(`${baseURL}/api/Reorder?${params.toString()}`, { credentials: "include" });
            if (!res.ok) throw new Error(`Failed to load reorders (${res.status})`);

            const data = await res.json();

            const mapped = (data.items || []).map(r => ({
                id: r.reorderId ?? null,
                productId: r.productId,
                product: r.productName ?? "—",
                supplierId: r.supplierId,
                supplier: r.supplierName ?? "—",
                userId: r.userId,
                employee: r.userFullName ?? "—",
                branchId: r.branchId,
                branch: r.branchName ?? "—",
                threshold: r.reorderThreshold ?? 0
            }));

            setAllReorders(mapped);

        } catch (err) {
            console.error("Error fetching reorders:", err);
            setError(`An error occurred while loading reorders: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }

    /* ----------------------------------------- */
    /*    APPLY FILTERS AND PAGINATION           */
    /* ----------------------------------------- */
    function applyFiltersAndPagination() {
        const dataSource = isReorderPage ? allReorders : allSupplierOrders;

        if (dataSource.length === 0) {
            if (isReorderPage) {
                setReorders([]);
            } else {
                setSupplierOrders([]);
            }
            setTotalPages(1);
            return;
        }

        let filtered = [...dataSource];

        // Apply client-side filters
        if (selectedSupplier) {
            filtered = filtered.filter(item => item.supplierId === selectedSupplier.supplierId);
        }
        if (selectedProduct) {
            filtered = filtered.filter(item => item.productId === selectedProduct.productId);
        }
        if (selectedEmployee) {
            filtered = filtered.filter(item =>
                isReorderPage ? item.userId === selectedEmployee.employeeId : item.employeeId === selectedEmployee.employeeId
            );
        }
        if (!isReorderPage && selectedStatus) {
            filtered = filtered.filter(item => item.supplierOrderStatusId == selectedStatus);
        }
        if (!isReorderPage && selectedType) {
            filtered = filtered.filter(item => item.supplierOrderTypeId == selectedType);
        }
        if (selectedBranch) {
            filtered = filtered.filter(item => item.branchId == selectedBranch);
        }

        // Calculate pagination based on filtered results
        const totalFiltered = filtered.length;
        const calculatedTotalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

        // If current page exceeds total pages, reset to page 1
        let adjustedPage = currentPage;
        if (currentPage > calculatedTotalPages) {
            adjustedPage = 1;
            setCurrentPage(1);
        }

        // Apply pagination
        const startIndex = (adjustedPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = filtered.slice(startIndex, endIndex);

        // Update state
        if (isReorderPage) {
            setReorders(paginatedData);
        } else {
            setSupplierOrders(paginatedData);
        }

        setTotalPages(calculatedTotalPages);
    }

    /* ----------------------------------------- */
    /*          VALIDATION HANDLERS              */
    /* ----------------------------------------- */
    const handleIdChange = (e) => {
        const val = e.target.value;
        if (validIdPattern.test(val)) {
            setIdError("");
            setIdSearch(val);
            setCurrentPage(1); // Reset to page 1 when searching
        } else {
            setIdError("Only numbers allowed.");
        }
    };

    const handleSupplierInputChange = (e) => {
        const val = e.target.value;
        if (!validSupplierPattern.test(val)) {
            setSupplierError("Only letters, spaces and - allowed.");
        } else {
            setSupplierError("");
            setSupplierQuery(val);
            setShowSupplierDropdown(true);
            setSupplierHighlightIndex(-1);
            if (!val) setSelectedSupplier(null);
        }
    };

    const handleProductInputChange = (e) => {
        const val = e.target.value;
        if (!validNamePattern.test(val)) {
            setProductError("Only letters, numbers, spaces, +, -, and dots allowed.");
        } else {
            setProductError("");
            setProductQuery(val);
            setShowProductDropdown(true);
            setProductHighlightIndex(-1);
            if (!val) setSelectedProduct(null);
        }
    };

    const handleEmployeeInputChange = (e) => {
        const val = e.target.value;
        if (!validEmployeePattern.test(val)) {
            setEmployeeError("Only letters, spaces, dots, and - allowed.");
        } else {
            setEmployeeError("");
            setEmployeeQuery(val);
            setShowEmployeeDropdown(true);
            setEmployeeHighlightIndex(-1);
            if (!val) setSelectedEmployee(null);
        }
    };

    const handleStatusChange = (e) => {
        setSelectedStatus(e.target.value);
        setCurrentPage(1); // Reset to page 1
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        setCurrentPage(1); // Reset to page 1
    };

    /* ----------------------------------------- */
    /*          FILTERED DROPDOWN LISTS          */
    /* ----------------------------------------- */
    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter(s => s.supplierName.toLowerCase().startsWith(supplierQuery.toLowerCase()))
        : supplierOptions;

    const filteredProducts = productQuery
        ? productOptions.filter(p => p.productName.toLowerCase().startsWith(productQuery.toLowerCase()))
        : productOptions;

    const filteredEmployees = employeeQuery
        ? employeeOptions.filter(e => e.employeeFullName.toLowerCase().startsWith(employeeQuery.toLowerCase()))
        : employeeOptions;

    /* ----------------------------------------- */
    /*          SELECTION HANDLERS               */
    /* ----------------------------------------- */
    const handleSelectSupplier = (supplier) => {
        setSelectedSupplier(supplier);
        setSupplierQuery(supplier.supplierName);
        setShowSupplierDropdown(false);
        setSupplierHighlightIndex(-1);
        setCurrentPage(1); // Reset to page 1
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setProductQuery(product.productName);
        setShowProductDropdown(false);
        setProductHighlightIndex(-1);
        setCurrentPage(1); // Reset to page 1
    };

    const handleSelectEmployee = (employee) => {
        setSelectedEmployee(employee);
        setEmployeeQuery(employee.employeeFullName);
        setShowEmployeeDropdown(false);
        setEmployeeHighlightIndex(-1);
        setCurrentPage(1); // Reset to page 1
    };

    /* ----------------------------------------- */
    /*          CLEAR FILTERS                    */
    /* ----------------------------------------- */
    const handleClearFilters = () => {
        setIdSearch("");
        setSelectedSupplier(null);
        setSelectedProduct(null);
        setSelectedEmployee(null);
        setSelectedStatus("");
        setSelectedType("");
        setFilterDate(null);
        setSelectedBranch("");

        setSupplierQuery("");
        setProductQuery("");
        setEmployeeQuery("");

        setIdError("");
        setSupplierError("");
        setProductError("");
        setEmployeeError("");

        setCurrentPage(1);

        // Refetch data to get fresh unfiltered results
        if (isReorderPage) {
            fetchReorders();
        } else {
            fetchSupplierOrders();
        }
    };

    /* ----------------------------------------- */
    /*          DELETE HANDLER                   */
    /* ----------------------------------------- */
    async function handleDeleteConfirm() {
        if (!deleteId) {
            setShowModal(false);
            return;
        }

        try {
            // Determine the endpoint based on the current tab
            const endpoint = isReorderPage
                ? `${baseURL}/api/Reorder/${deleteId}` // Reorder delete endpoint
                : `${baseURL}/api/SupplierOrder/${deleteId}`; // Order delete endpoint

            // Make the DELETE request
            const res = await fetch(endpoint, {
                method: "DELETE",
                credentials: "include"
            });

            if (!res.ok) throw new Error(`Delete failed (${res.status})`);

            // Refetch data after deletion
            if (isReorderPage) {
                await fetchReorders();
            } else {
                await fetchSupplierOrders();
            }
        } catch (err) {
            console.error("Delete error:", err);
            setError(`An error occurred while deleting the record: ${err.message}`);
        } finally {
            // Reset delete state and close modal
            setDeleteId(null);
            setShowModal(false);
        }
    }

    /* ----------------------------------------- */
    /*          UTILITY FUNCTIONS                */
    /* ----------------------------------------- */
    // Format date the same way as Inventory (DD/MM/YYYY)
    function formatDate(dateValue) {
        if (!dateValue) return "";
        const d = new Date(dateValue);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }

    return (
        <div className="orders-page">

            {/* ================= TITLE ================= */}
            <h2 className="text-center fw-bold orders-title">
                {isReorderPage ? "Reorders" : "Orders"}
            </h2>

            {/* ================= FILTER SECTION 1 ================= */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Enter order id for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${idError ? "is-invalid" : ""}`}
                            placeholder="Search Order by ID"
                            value={idSearch}
                            onChange={handleIdChange}
                        />
                        <div style={{ height: "20px" }}>
                            {idError && <div className="invalid-feedback d-block">{idError}</div>}
                        </div>
                    </div>

                    <div className="mb-2" ref={supplierRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select supplier for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${supplierError ? "is-invalid" : ""}`}
                            placeholder="Filter Orders by Supplier Name"
                            value={supplierQuery}
                            onChange={handleSupplierInputChange}
                            onFocus={() => { setShowSupplierDropdown(true); setSupplierHighlightIndex(-1); }}
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
                                        onClick={() => handleSelectSupplier(s)}
                                        onMouseEnter={() => setSupplierHighlightIndex(idx)}
                                    >
                                        {s.supplierName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </FilterLeft>

                <FilterRight>
                    <div className="d-flex gap-2">
                        <ClearButton onClear={handleClearFilters} />
                        {!isReorderPage ? (
                            <PageAddButton to="/orders/create" text="Create New Order" />
                        ) : (
                            <PageAddButton to="/orders/create-auto" text="Create New Automated Order" />
                        )}
                    </div>
                </FilterRight>
            </FilterSection>

            {/* ================= FILTER SECTION 2 ================= */}
            <FilterSection>
                <FilterLeft>
                    <div className="mb-2" ref={productRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select product for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${productError ? "is-invalid" : ""}`}
                            placeholder="Filter Orders by Product Name"
                            value={productQuery}
                            onChange={handleProductInputChange}
                            onFocus={() => { setShowProductDropdown(true); setProductHighlightIndex(-1); }}
                            autoComplete="off"
                        />
                        <div style={{ height: "20px" }}>
                            {productError && <div className="invalid-feedback d-block">{productError}</div>}
                        </div>

                        {showProductDropdown && filteredProducts.length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredProducts.map((p, idx) => (
                                    <li
                                        key={p.productId}
                                        className={`list-group-item list-group-item-action ${idx === productHighlightIndex ? "active" : ""}`}
                                        onClick={() => handleSelectProduct(p)}
                                        onMouseEnter={() => setProductHighlightIndex(idx)}
                                    >
                                        {p.productName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="mb-2" ref={employeeRef} style={{ position: "relative" }}>
                        <div className="filter-label fst-italic small">Search or select employee for automatic search</div>
                        <input
                            type="text"
                            className={`form-control filter-text-input ${employeeError ? "is-invalid" : ""}`}
                            placeholder="Filter Orders by Employee Name"
                            value={employeeQuery}
                            onChange={handleEmployeeInputChange}
                            onFocus={() => { setShowEmployeeDropdown(true); setEmployeeHighlightIndex(-1); }}
                            autoComplete="off"
                        />
                        <div style={{ height: "20px" }}>
                            {employeeError && <div className="invalid-feedback d-block">{employeeError}</div>}
                        </div>

                        {showEmployeeDropdown && filteredEmployees.length > 0 && (
                            <ul className="list-group position-absolute searchable-dropdown product-filter-dropdown" style={{ zIndex: 1500, maxHeight: 200, overflowY: "auto" }}>
                                {filteredEmployees.map((e, idx) => (
                                    <li
                                        key={e.employeeId}
                                        className={`list-group-item list-group-item-action ${idx === employeeHighlightIndex ? "active" : ""}`}
                                        onClick={() => handleSelectEmployee(e)}
                                        onMouseEnter={() => setEmployeeHighlightIndex(idx)}
                                    >
                                        {e.employeeFullName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="mb-2">
                        <div className="filter-label fst-italic small">Select branch for automatic search</div>
                        <FilterDropdown
                            placeholder="Filter Orders by Branch"
                            options={branchOptions}
                            value={selectedBranch}
                            onChange={(e) => {
                                setSelectedBranch(e.target.value);
                                setCurrentPage(1); // Reset to page 1
                            }}
                        />
                        <div style={{ height: "20px" }}></div>
                    </div>
                </FilterLeft>
            </FilterSection>

            {/* ================= FILTER SECTION 3 ================= */}
            <FilterSection>
                <FilterLeft>

                    {!isReorderPage && (
                        <div className="mb-2">
                            <div className="filter-label fst-italic small">Select status for automatic search</div>
                            <FilterDropdown
                                placeholder="Filter Orders by Status"
                                options={statusOptions}
                                value={selectedStatus}
                                onChange={handleStatusChange}
                            />
                            <div style={{ height: "20px" }}></div>
                        </div>
                    )}

                    {!isReorderPage && (
                        <div className="mb-2">
                            <div className="filter-label fst-italic small">Select type for automatic search</div>
                            <FilterDropdown
                                placeholder="Filter Orders by Type"
                                options={typeOptions}
                                value={selectedType}
                                onChange={handleTypeChange}
                            />
                            <div style={{ height: "20px" }}></div>
                        </div>
                    )}

                    {!isReorderPage && (
                        <div className="mb-4">
                            <div className="filter-label fst-italic small">Select date for automatic search</div>
                            <DataPicker
                                name="orderCreationDate"
                                selected={filterDate}
                                onChange={(d) => {
                                    setFilterDate(d);
                                    setCurrentPage(1); // Reset to page 1
                                }}
                                placeholderText={"Filter By Order Creation Date"}
                            />
                        </div>
                    )}

                </FilterLeft>
            </FilterSection>

            {/* ==================== TABS ==================== */}
            <ul className="nav nav-tabs orders-tabs">
                <li className="nav-item">
                    <button
                        className={`nav-link ${!isReorderPage ? "active" : ""}`}
                        onClick={() => {
                            setIsReorderPage(false);
                            handleClearFilters(); // Clear filters when switching tabs
                        }}
                    >
                        Orders List
                    </button>
                </li>

                <li className="nav-item">
                    <button
                        className={`nav-link ${isReorderPage ? "active" : ""}`}
                        onClick={() => {
                            setIsReorderPage(true);
                            handleClearFilters(); // Clear filters when switching tabs
                        }}
                    >
                        Reorder Requests
                    </button>
                </li>
            </ul>

            {/* ==================== TABLE ==================== */}
            {loading && <div className="text-center text-muted my-3">Loading...</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <DataTable
                columns={isReorderPage ? reorderColumns : orderColumns}
                data={isReorderPage ? reorders : supplierOrders}
                renderMap={renderMap}
            />

            {/* ==================== PAGINATION ==================== */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
            />

            {/* ==================== DELETE MODAL ==================== */}
            <DeleteModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleDeleteConfirm}
                message="Are you sure you want to delete this record?"
            />
        </div>
    );
}