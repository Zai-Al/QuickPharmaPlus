import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Inventory/AddInventory.css";
import "./GenerateReport.css";

import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../../Components/Form/FormAddButton";
import FormHeader from "../../../../Components/InternalSystem/FormHeader";
import DatePicker from "../../../../Components/Form/FormDatePicker";

export default function GenerateReport() {
    const navigate = useNavigate();
    const baseURL = ""; // use Vite proxy

    const allBranchesValue = "ALL";

    // =================== STATE ===================
    const [reportTypeId, setReportTypeId] = useState("");
    const [branchId, setBranchId] = useState(allBranchesValue);

    const [dateFrom, setDateFrom] = useState(null);
    const [dateTo, setDateTo] = useState(null);

    const [categoryId, setCategoryId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [productId, setProductId] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== DROPDOWN OPTIONS ===================
    const [reportTypeOptions, setReportTypeOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    const [loadingReportTypes, setLoadingReportTypes] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // =================== SEARCHABLE CATEGORY DROPDOWN ===================
    const [categoryQuery, setCategoryQuery] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
    const categoryRef = useRef(null);

    // =================== SEARCHABLE SUPPLIER DROPDOWN ===================
    const [supplierQuery, setSupplierQuery] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(0);
    const supplierRef = useRef(null);

    // =================== SEARCHABLE PRODUCT DROPDOWN ===================
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productHighlightIndex, setProductHighlightIndex] = useState(0);
    const productRef = useRef(null);

    // =================== FETCH DATA ON MOUNT ===================
    useEffect(() => {
        fetchReportTypes();
        fetchBranches();
        fetchCategories();
        fetchSuppliers();
        fetchProducts();
    }, []);

    // =================== OUTSIDE CLICK CLOSE ===================
    useEffect(() => {
        const onDocClick = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
                setCategoryHighlightIndex(0);
            }
            if (supplierRef.current && !supplierRef.current.contains(e.target)) {
                setShowSupplierDropdown(false);
                setSupplierHighlightIndex(0);
            }
            if (productRef.current && !productRef.current.contains(e.target)) {
                setShowProductDropdown(false);
                setProductHighlightIndex(0);
            }
        };

        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // =================== FETCH FUNCTIONS ===================
    const fetchReportTypes = async () => {
        try {
            setLoadingReportTypes(true);
            const res = await fetch(`${baseURL}/api/ReportTypes`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch report types");

            const data = await res.json();
            const items = data.items ?? [];

            setReportTypeOptions(
                (items || []).map((x) => ({
                    value: String(x.value),
                    label: x.label ?? `Type ${x.value}`
                }))
            );
        } catch (err) {
            console.error("Error fetching report types:", err);
            setReportTypeOptions([]);
            setErrorMessage("Failed to load report types.");
        } finally {
            setLoadingReportTypes(false);
        }
    };

    const fetchBranches = async () => {
        try {
            setLoadingBranches(true);
            const res = await fetch(`${baseURL}/api/Branch?pageNumber=1&pageSize=200`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch branches");

            const data = await res.json();
            const items = data.items ?? [];

            setBranchOptions(
                (items || []).map((b) => ({
                    value: String(b.branchId),
                    label: b.cityName ?? `Branch ${b.branchId}`
                }))
            );
        } catch (err) {
            console.error("Error fetching branches:", err);
            setBranchOptions([]);
            setErrorMessage("Failed to load branches.");
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const res = await fetch(`${baseURL}/api/Category?pageNumber=1&pageSize=500`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch categories");

            const data = await res.json();
            const items = data.items ?? [];

            setCategoryOptions(
                (items || []).map((c) => ({
                    value: String(c.categoryId),
                    categoryName: c.categoryName ?? `Category ${c.categoryId}`
                }))
            );
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategoryOptions([]);
            setErrorMessage("Failed to load categories.");
        } finally {
            setLoadingCategories(false);
        }
    };

    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const res = await fetch(`${baseURL}/api/Suppliers?pageNumber=1&pageSize=500`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch suppliers");

            const data = await res.json();
            const items = data.items ?? [];

            setSupplierOptions(
                (items || []).map((s) => ({
                    value: String(s.supplierId),
                    supplierName: s.supplierName ?? `Supplier ${s.supplierId}`
                }))
            );
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setSupplierOptions([]);
            setErrorMessage("Failed to load suppliers.");
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const res = await fetch(`${baseURL}/api/Products?pageNumber=1&pageSize=500`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch products");

            const data = await res.json();
            const items = data.items ?? [];

            setProductOptions(
                (items || []).map((p) => ({
                    value: String(p.productId),
                    productName: p.productName ?? `Product ${p.productId}`
                }))
            );
        } catch (err) {
            console.error("Error fetching products:", err);
            setProductOptions([]);
            setErrorMessage("Failed to load products.");
        } finally {
            setLoadingProducts(false);
        }
    };

    // =================== CONDITIONAL UI ===================
    const selectedReportTypeId = reportTypeId ? parseInt(reportTypeId, 10) : 0;

    const showCategory = selectedReportTypeId === 2;
    const showSupplier = selectedReportTypeId === 3;
    const showProduct = selectedReportTypeId === 4;

    // Reset irrelevant selections when report type changes
    useEffect(() => {
        setCategoryId("");
        setSupplierId("");
        setProductId("");

        setCategoryQuery("");
        setSupplierQuery("");
        setProductQuery("");

        setShowCategoryDropdown(false);
        setShowSupplierDropdown(false);
        setShowProductDropdown(false);

        setErrors((prev) => ({ ...prev, category: "", supplier: "", product: "" }));
        setTouched((prev) => ({ ...prev, category: false, supplier: false, product: false }));
    }, [reportTypeId]);

    // =================== VALIDATION ===================
    const validateReportType = (value) => {
        if (!value) return "Report type must be selected.";
        return "";
    };

    const validateBranch = (value) => {
        if (!value) return "Branch must be selected.";
        return "";
    };

    const validateDateFrom = (value) => {
        if (!value) return "Start date is required.";
        return "";
    };

    const validateDateTo = (value) => {
        if (!value) return "End date is required.";
        return "";
    };

    const validateDateRange = (from, to) => {
        if (!from || !to) return "";
        const f = new Date(from);
        const t = new Date(to);
        if (f > t) return "Start date must be before or equal to end date.";
        return "";
    };

    const validateCategory = (value) => {
        if (showCategory && !value) return "Category must be selected.";
        return "";
    };

    const validateSupplier = (value) => {
        if (showSupplier && !value) return "Supplier must be selected.";
        return "";
    };

    const validateProduct = (value) => {
        if (showProduct && !value) return "Product must be selected.";
        return "";
    };

    // =================== HELPERS ===================
    const toYmd = (d) => {
        if (!d) return "";
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    // =================== FILTERED OPTIONS ===================
    const filteredCategories = categoryQuery
        ? categoryOptions.filter(c => c.categoryName.toLowerCase().startsWith(categoryQuery.toLowerCase()))
        : categoryOptions;

    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter(s => s.supplierName.toLowerCase().startsWith(supplierQuery.toLowerCase()))
        : supplierOptions;

    const filteredProducts = productQuery
        ? productOptions.filter(p => p.productName.toLowerCase().startsWith(productQuery.toLowerCase()))
        : productOptions;

    // =================== CHANGE HANDLERS (Match AddInventory UX) ===================
    const handleReportTypeChange = (e) => {
        const value = e.target.value;
        setReportTypeId(value);
        setTouched(prev => ({ ...prev, reportType: true }));

        const error = validateReportType(value);
        setErrors(prev => ({ ...prev, reportType: error }));
    };

    const handleBranchChange = (e) => {
        const value = e.target.value;
        setBranchId(value);
        setTouched(prev => ({ ...prev, branch: true }));

        const error = validateBranch(value);
        setErrors(prev => ({ ...prev, branch: error }));
    };

    const handleDateFromChange = (date) => {
        setDateFrom(date);
        setTouched(prev => ({ ...prev, dateFrom: true }));

        const dateFromError = validateDateFrom(date);
        const rangeError = validateDateRange(date, dateTo);

        setErrors(prev => ({ ...prev, dateFrom: dateFromError, dateRange: rangeError }));
    };

    const handleDateToChange = (date) => {
        setDateTo(date);
        setTouched(prev => ({ ...prev, dateTo: true }));

        const dateToError = validateDateTo(date);
        const rangeError = validateDateRange(dateFrom, date);

        setErrors(prev => ({ ...prev, dateTo: dateToError, dateRange: rangeError }));
    };

    // Category searchable
    const handleCategoryInputChange = (e) => {
        const value = e.target.value;
        setCategoryQuery(value);
        setShowCategoryDropdown(true);
        setCategoryHighlightIndex(0);
        setTouched(prev => ({ ...prev, category: true }));

        if (!value) {
            setCategoryId("");
            const error = validateCategory("");
            setErrors(prev => ({ ...prev, category: error }));
        }
    };

    const handleSelectCategory = (opt) => {
        setCategoryId(opt.value);
        setCategoryQuery(opt.categoryName);
        setShowCategoryDropdown(false);
        setCategoryHighlightIndex(0);

        setTouched(prev => ({ ...prev, category: true }));
        const error = validateCategory(opt.value);
        setErrors(prev => ({ ...prev, category: error }));
    };

    const handleCategoryKeyDown = (e) => {
        if (!showCategoryDropdown) return;
        const list = filteredCategories || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setCategoryHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCategoryHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[categoryHighlightIndex];
            if (picked) handleSelectCategory(picked);
        } else if (e.key === "Escape") {
            setShowCategoryDropdown(false);
        }
    };

    // Supplier searchable
    const handleSupplierInputChange = (e) => {
        const value = e.target.value;
        setSupplierQuery(value);
        setShowSupplierDropdown(true);
        setSupplierHighlightIndex(0);
        setTouched(prev => ({ ...prev, supplier: true }));

        if (!value) {
            setSupplierId("");
            const error = validateSupplier("");
            setErrors(prev => ({ ...prev, supplier: error }));
        }
    };

    const handleSelectSupplier = (opt) => {
        setSupplierId(opt.value);
        setSupplierQuery(opt.supplierName);
        setShowSupplierDropdown(false);
        setSupplierHighlightIndex(0);

        setTouched(prev => ({ ...prev, supplier: true }));
        const error = validateSupplier(opt.value);
        setErrors(prev => ({ ...prev, supplier: error }));
    };

    const handleSupplierKeyDown = (e) => {
        if (!showSupplierDropdown) return;
        const list = filteredSuppliers || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSupplierHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSupplierHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[supplierHighlightIndex];
            if (picked) handleSelectSupplier(picked);
        } else if (e.key === "Escape") {
            setShowSupplierDropdown(false);
        }
    };

    // Product searchable
    const handleProductInputChange = (e) => {
        const value = e.target.value;
        setProductQuery(value);
        setShowProductDropdown(true);
        setProductHighlightIndex(0);
        setTouched(prev => ({ ...prev, product: true }));

        if (!value) {
            setProductId("");
            const error = validateProduct("");
            setErrors(prev => ({ ...prev, product: error }));
        }
    };

    const handleSelectProduct = (opt) => {
        setProductId(opt.value);
        setProductQuery(opt.productName);
        setShowProductDropdown(false);
        setProductHighlightIndex(0);

        setTouched(prev => ({ ...prev, product: true }));
        const error = validateProduct(opt.value);
        setErrors(prev => ({ ...prev, product: error }));
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

    // =================== SUBMIT ===================
    const canSubmit = useMemo(() => {
        if (!reportTypeId) return false;
        if (!branchId) return false;
        if (!dateFrom || !dateTo) return false;
        if (new Date(dateFrom) > new Date(dateTo)) return false;

        if (showCategory && !categoryId) return false;
        if (showSupplier && !supplierId) return false;
        if (showProduct && !productId) return false;

        return true;
    }, [reportTypeId, branchId, dateFrom, dateTo, showCategory, showSupplier, showProduct, categoryId, supplierId, productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setTouched({
            reportType: true,
            branch: true,
            dateFrom: true,
            dateTo: true,
            category: showCategory,
            supplier: showSupplier,
            product: showProduct
        });

        const nextErrors = {
            reportType: validateReportType(reportTypeId),
            branch: validateBranch(branchId),
            dateFrom: validateDateFrom(dateFrom),
            dateTo: validateDateTo(dateTo),
            dateRange: validateDateRange(dateFrom, dateTo),
            category: validateCategory(categoryId),
            supplier: validateSupplier(supplierId),
            product: validateProduct(productId)
        };

        setErrors(nextErrors);

        const hasErrors = Object.values(nextErrors).some(x => x);
        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        const selectedReportType = reportTypeOptions.find(x => x.value === reportTypeId);

        const payload = {
            reportType: selectedReportType?.label ?? null,
            branch: branchId,
            dateFrom: toYmd(dateFrom),
            dateTo: toYmd(dateTo),
            productCategory: showCategory ? categoryId : null,
            supplier: showSupplier ? supplierId : null,
            product: showProduct ? productId : null
        };

        try {
            const response = await fetch(`${baseURL}/api/Reports/Generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccessMessage("Report generated successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/reports"), 1500);
            } else {
                const body = await response.text().catch(() => "");
                setErrorMessage(body || "Failed to generate report.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Generate report error:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    return (
        <div className="add-inventory-page">
            <FormHeader title="Generate New Report" to="/reports" />

            {successMessage && (
                <div className="alert alert-success alert-dismissible inventory-alert w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible inventory-alert w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setErrorMessage("")}></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Select Report Details:">
                <form className="add-inventory-form" onSubmit={handleSubmit}>
                    {/* REPORT TYPE (DB) */}
                    <div className="inventory-field">
                        <select
                            className={`form-control form-dropdown ${touched.reportType && errors.reportType ? "is-invalid" : ""}`}
                            value={reportTypeId}
                            onChange={handleReportTypeChange}
                            disabled={loadingReportTypes}
                        >
                            <option value="">
                                {loadingReportTypes ? "Loading report types..." : "Select Report Type"}
                            </option>
                            {reportTypeOptions.map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {touched.reportType && errors.reportType && (
                            <div className="invalid-feedback d-block">{errors.reportType}</div>
                        )}
                    </div>

                    {/* BRANCH (DB) */}
                    <div className="inventory-field">
                        <select
                            className={`form-control form-dropdown ${touched.branch && errors.branch ? "is-invalid" : ""}`}
                            value={branchId}
                            onChange={handleBranchChange}
                            disabled={loadingBranches}
                        >
                            <option value={allBranchesValue}>All branches</option>
                            {branchOptions.map((opt, idx) => (
                                <option key={idx} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>

                        {touched.branch && errors.branch && (
                            <div className="invalid-feedback d-block">{errors.branch}</div>
                        )}
                    </div>

                    {/* DATE FROM */}
                    <div className="inventory-field">
                        <DatePicker
                            selected={dateFrom}
                            onChange={handleDateFromChange}
                            placeholderText="Start date"
                            className="form-control form-text-input"
                        />
                        {touched.dateFrom && errors.dateFrom && (
                            <div className="inventory-validation-text">{errors.dateFrom}</div>
                        )}
                    </div>

                    {/* DATE TO */}
                    <div className="inventory-field">
                        <DatePicker
                            selected={dateTo}
                            onChange={handleDateToChange}
                            placeholderText="End date"
                            className="form-control form-text-input"
                        />
                        {touched.dateTo && errors.dateTo && (
                            <div className="inventory-validation-text">{errors.dateTo}</div>
                        )}
                    </div>

                    {(touched.dateFrom || touched.dateTo) && errors.dateRange && (
                        <div className="inventory-field">
                            <div className="inventory-validation-text">{errors.dateRange}</div>
                        </div>
                    )}

                    {/* CATEGORY (only for type 2) */}
                    {showCategory && (
                        <div className="mb-3 inventory-field" ref={categoryRef}>
                            <input
                                type="text"
                                className={`form-control form-text-input ${touched.category && errors.category ? "is-invalid" : ""}`}
                                style={{ width: "100%" }}
                                placeholder={loadingCategories ? "Loading categories..." : "Search or select category"}
                                value={categoryQuery}
                                onChange={handleCategoryInputChange}
                                onFocus={() => setShowCategoryDropdown(true)}
                                onKeyDown={handleCategoryKeyDown}
                                disabled={loadingCategories}
                                autoComplete="off"
                            />

                            {showCategoryDropdown && filteredCategories.length > 0 && (
                                <ul className="list-group position-absolute searchable-dropdown inventory-dropdown">
                                    {filteredCategories.map((c, idx) => (
                                        <li
                                            key={c.value}
                                            className={`list-group-item list-group-item-action ${idx === categoryHighlightIndex ? "active" : ""}`}
                                            onMouseDown={(ev) => { ev.preventDefault(); }}
                                            onClick={() => handleSelectCategory(c)}
                                            onMouseEnter={() => setCategoryHighlightIndex(idx)}
                                        >
                                            {c.categoryName}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {touched.category && errors.category && (
                                <div className="invalid-feedback d-block">{errors.category}</div>
                            )}
                        </div>
                    )}

                    {/* SUPPLIER (only for type 3) */}
                    {showSupplier && (
                        <div className="mb-3 inventory-field" ref={supplierRef}>
                            <input
                                type="text"
                                className={`form-control form-text-input ${touched.supplier && errors.supplier ? "is-invalid" : ""}`}
                                style={{ width: "100%" }}
                                placeholder={loadingSuppliers ? "Loading suppliers..." : "Search or select supplier"}
                                value={supplierQuery}
                                onChange={handleSupplierInputChange}
                                onFocus={() => setShowSupplierDropdown(true)}
                                onKeyDown={handleSupplierKeyDown}
                                disabled={loadingSuppliers}
                                autoComplete="off"
                            />

                            {showSupplierDropdown && filteredSuppliers.length > 0 && (
                                <ul className="list-group position-absolute searchable-dropdown inventory-dropdown">
                                    {filteredSuppliers.map((s, idx) => (
                                        <li
                                            key={s.value}
                                            className={`list-group-item list-group-item-action ${idx === supplierHighlightIndex ? "active" : ""}`}
                                            onMouseDown={(ev) => { ev.preventDefault(); }}
                                            onClick={() => handleSelectSupplier(s)}
                                            onMouseEnter={() => setSupplierHighlightIndex(idx)}
                                        >
                                            {s.supplierName}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {touched.supplier && errors.supplier && (
                                <div className="invalid-feedback d-block">{errors.supplier}</div>
                            )}
                        </div>
                    )}

                    {/* PRODUCT (only for type 4) */}
                    {showProduct && (
                        <div className="mb-3 inventory-field" ref={productRef}>
                            <input
                                type="text"
                                className={`form-control form-text-input ${touched.product && errors.product ? "is-invalid" : ""}`}
                                style={{ width: "100%" }}
                                placeholder={loadingProducts ? "Loading products..." : "Search or select product"}
                                value={productQuery}
                                onChange={handleProductInputChange}
                                onFocus={() => setShowProductDropdown(true)}
                                onKeyDown={handleProductKeyDown}
                                disabled={loadingProducts}
                                autoComplete="off"
                            />

                            {showProductDropdown && filteredProducts.length > 0 && (
                                <ul className="list-group position-absolute searchable-dropdown inventory-dropdown">
                                    {filteredProducts.map((p, idx) => (
                                        <li
                                            key={p.value}
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

                            {touched.product && errors.product && (
                                <div className="invalid-feedback d-block">{errors.product}</div>
                            )}
                        </div>
                    )}

                    <AddButton text="Generate Report" type="submit" disabled={!canSubmit} />
                </form>
            </FormWrapper>
        </div>
    );
}
