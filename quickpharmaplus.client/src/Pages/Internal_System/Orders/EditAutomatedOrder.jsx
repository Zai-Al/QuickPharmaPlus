import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateOrder.css";
import "../Products/AddProduct.css"; // Import AddProduct CSS for consistency

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";
import { AuthContext } from "../../../Context/AuthContext";

export default function EditAutomatedOrder() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get the reorder ID from the URL
    const { user } = useContext(AuthContext);

    // ===================== STATE =====================
    const [supplierId, setSupplierId] = useState("");
    const [productId, setProductId] = useState("");
    const [threshold, setThreshold] = useState("");
    const [quantity, setQuantity] = useState("");
    const [branchId, setBranchId] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== DROPDOWN OPTIONS ===================
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);

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

    // =================== VALIDATION PATTERNS ===================
    const quantityPattern = /^[1-9][0-9]*$/; // Positive integers only, no leading zeros

    // =================== CHECK USER ROLE (SAME AS NAVBAR) ===================
    const roles = user?.roles || [];
    const isAdmin = roles.includes("Admin");

    // =================== FETCH DATA ON MOUNT ===================
    useEffect(() => {
        fetchSuppliers();

        if (isAdmin) {
            fetchBranches();
        }
    }, [isAdmin]);

    useEffect(() => {
        if (supplierOptions.length > 0) {
            fetchReorderDetails();
        }
    }, [supplierOptions]);

    // Close supplier dropdown on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (supplierRef.current && !supplierRef.current.contains(e.target)) {
                setShowSupplierDropdown(false);
                setSupplierHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Close product dropdown on outside click
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

    useEffect(() => {
        if (productOptions.length > 0 && productId) {
            const product = productOptions.find(
                p => p.value === productId
            );

            if (product) {
                setProductQuery(product.productName);
            }
        }
    }, [productOptions, productId]);

    // =================== FETCH FUNCTIONS ===================
    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const response = await fetch(`/api/Suppliers?pageNumber=1&pageSize=200`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch suppliers");

            const data = await response.json();
            const items = data.items || [];

            const options = items.map((s) => ({
                value: s.supplierId,
                label: s.supplierName ?? `Supplier ${s.supplierId}`,
                supplierName: s.supplierName ?? `Supplier ${s.supplierId}`
            }));

            setSupplierOptions(options);
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setErrorMessage("Failed to load suppliers.");
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchProductsForSupplier = async (selectedSupplierId) => {
        try {
            setLoadingProducts(true);
            const response = await fetch(
                `/api/SupplierOrder/supplier/${selectedSupplierId}/products`,
                { credentials: "include" }
            );

            if (!response.ok) throw new Error("Failed to fetch products");

            const data = await response.json();

            const options = (data || []).map((p) => ({
                value: p.productId,
                label: p.productName ?? `Product ${p.productId}`,
                productName: p.productName ?? `Product ${p.productId}`
            }));

            setProductOptions(options);
        } catch (err) {
            console.error("Error fetching products:", err);
            setErrorMessage("Failed to load products for selected supplier.");
            setProductOptions([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    const fetchBranches = async () => {
        try {
            setLoadingBranches(true);
            const response = await fetch(`/api/Branch?pageNumber=1&pageSize=100`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch branches");

            const data = await response.json();
            const branches = data.items || [];

            const options = branches.map((b) => ({
                value: b.branchId,
                label: b.cityName ?? `Branch ${b.branchId}`
            }));

            setBranchOptions(options);
        } catch (err) {
            console.error("Error fetching branches:", err);
            setErrorMessage("Failed to load branches.");
        } finally {
            setLoadingBranches(false);
        }
    };

    const fetchReorderDetails = async () => {
        try {
            const response = await fetch(`/api/Reorder/${id}`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch reorder details");

            const data = await response.json();

            // Supplier
            setSupplierId(data.supplierId || "");
            setSupplierQuery(data.supplierName || "");

            // Fetch products for supplier BEFORE setting product
            if (data.supplierId) {
                await fetchProductsForSupplier(data.supplierId);
            }

            // Product
            setProductId(data.productId || "");
            setProductQuery(data.productName || "");

            // Numbers
            setThreshold(
                data.reorderThreshold !== null
                    ? data.reorderThreshold.toString()
                    : ""
            );

            setQuantity(
                data.reoderQuantity !== null
                    ? data.reoderQuantity.toString()
                    : ""
            );

            setBranchId(data.branchId || "");
        } catch (err) {
            console.error("Error fetching reorder details:", err);
            setErrorMessage("Failed to load reorder details.");
        }
    };

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const touchedFields = {
            supplier: true,
            product: true,
            threshold: true,
            quantity: true
        };

        if (isAdmin) {
            touchedFields.branch = true;
        }

        setTouched(touchedFields);

        const validationErrors = {
            supplier: validateSupplier(supplierId),
            product: validateProduct(productId),
            threshold: validateThreshold(threshold),
            quantity: validateQuantity(quantity)
        };

        if (isAdmin) {
            validationErrors.branch = validateBranch(branchId);
        }

        setErrors(validationErrors);

        const hasErrors = Object.values(validationErrors).some((error) => error !== "");

        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        const payload = {
            SupplierId: parseInt(supplierId, 10),
            ProductId: parseInt(productId, 10),
            Threshold: parseInt(threshold.trim(), 10),
            Quantity: parseInt(quantity.trim(), 10)
        };
        if (isAdmin && branchId) {
            payload.BranchId = parseInt(branchId, 10);
        }

        try {
            const response = await fetch(`/api/Reorder/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccessMessage("Automated order updated successfully!");
                setErrorMessage("");

                // Log the update in the database
                await logUpdate();

                setTimeout(() => navigate("/orders?tab=reorder"), 1500);
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || "Failed to update automated order.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error updating automated order:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    const logUpdate = async () => {
        try {
            const logPayload = {
                action: "Update",
                entity: "Reorder",
                entityId: id,
                userId: user.id,
                timestamp: new Date().toISOString()
            };

            await fetch(`/api/Logs`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(logPayload)
            });
        } catch (err) {
            console.error("Error logging update:", err);
        }
    };

    const validateSupplier = (value) => {
        if (!value) return "Supplier must be selected.";
        return "";
    };

    const validateProduct = (value) => {
        if (!value) return "Product must be selected.";
        return "";
    };

    const validateThreshold = (value) => {
        if (!value.trim()) return "Threshold is required.";
        if (!quantityPattern.test(value.trim())) {
            return "Threshold must be a positive integer greater than 0 (no decimals).";
        }
        const num = parseInt(value.trim(), 10);
        if (num <= 0) return "Threshold must be greater than 0.";
        return "";
    };

    const validateQuantity = (value) => {
        if (!value.trim()) return "Quantity is required.";
        if (!quantityPattern.test(value.trim())) {
            return "Quantity must be a positive integer greater than 0 (no decimals).";
        }
        const num = parseInt(value.trim(), 10);
        if (num <= 0) return "Quantity must be greater than 0.";
        return "";
    };

    const validateBranch = (value) => {
        if (isAdmin && !value) return "Branch must be selected.";
        return "";
    };

    // =================== SUPPLIER SEARCHABLE DROPDOWN HANDLERS ===================
    const handleSupplierInputChange = (e) => {
        const value = e.target.value;
        setSupplierQuery(value);
        setShowSupplierDropdown(true);
        setSupplierHighlightIndex(0);
        setTouched((prev) => ({ ...prev, supplier: true }));

        if (!value) {
            setSupplierId("");
            setProductId("");
            setProductQuery("");
            setProductOptions([]);
            const error = validateSupplier("");
            setErrors((prev) => ({ ...prev, supplier: error, product: "" }));
        }
    };

    const handleSupplierInputFocus = () => {
        setShowSupplierDropdown(true);
        setSupplierHighlightIndex(0);
    };

    const handleSupplierKeyDown = (e) => {
        if (!showSupplierDropdown) return;
        const list = filteredSuppliers || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSupplierHighlightIndex((i) => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSupplierHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[supplierHighlightIndex];
            if (picked) handleSelectSupplier(picked);
        } else if (e.key === "Escape") {
            setShowSupplierDropdown(false);
        }
    };

    const handleSelectSupplier = (supplierOption) => {
        setSupplierId(supplierOption.value);
        setSupplierQuery(supplierOption.supplierName);
        setShowSupplierDropdown(false);
        setSupplierHighlightIndex(0);
        setTouched((prev) => ({ ...prev, supplier: true }));

        const error = validateSupplier(supplierOption.value);
        setErrors((prev) => ({ ...prev, supplier: error }));

        // Reset product selection
        setProductId("");
        setProductQuery("");
        setTouched((prev) => ({ ...prev, product: false }));
        setErrors((prev) => ({ ...prev, product: "" }));

        // Fetch products for selected supplier
        fetchProductsForSupplier(supplierOption.value);
    };

    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter((s) =>
            s.supplierName.toLowerCase().startsWith(supplierQuery.toLowerCase())
        )
        : supplierOptions;

    // =================== PRODUCT SEARCHABLE DROPDOWN HANDLERS ===================
    const handleProductInputChange = (e) => {
        const value = e.target.value;
        setProductQuery(value);
        setShowProductDropdown(true);
        setProductHighlightIndex(0);
        setTouched((prev) => ({ ...prev, product: true }));

        if (!value) {
            setProductId("");
            const error = validateProduct("");
            setErrors((prev) => ({ ...prev, product: error }));
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
            setProductHighlightIndex((i) => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setProductHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[productHighlightIndex];
            if (picked) handleSelectProduct(picked);
        } else if (e.key === "Escape") {
            setShowProductDropdown(false);
        }
    };

    const handleSelectProduct = (productOption) => {
        setProductId(productOption.value);
        setProductQuery(productOption.productName);
        setShowProductDropdown(false);
        setProductHighlightIndex(0);
        setTouched((prev) => ({ ...prev, product: true }));

        const error = validateProduct(productOption.value);
        setErrors((prev) => ({ ...prev, product: error }));
    };

    const filteredProducts = productQuery
        ? productOptions.filter((p) =>
            p.productName.toLowerCase().startsWith(productQuery.toLowerCase())
        )
        : productOptions;

    const handleThresholdChange = (e) => {
        const value = e.target.value;

        setTouched((prev) => ({ ...prev, threshold: true }));

        if (value === "") {
            setThreshold("");
            setErrors((prev) => ({ ...prev, threshold: "Threshold is required." }));
            return;
        }

        if (!/^[0-9]*$/.test(value)) {
            setErrors((prev) => ({ ...prev, threshold: "Only numbers allowed." }));
            return;
        }

        setThreshold(value);

        const error = validateThreshold(value);
        setErrors((prev) => ({ ...prev, threshold: error }));
    };

    const handleQuantityChange = (e) => {
        const value = e.target.value;

        setTouched((prev) => ({ ...prev, quantity: true }));

        if (value === "") {
            setQuantity("");
            setErrors((prev) => ({ ...prev, quantity: "Quantity is required." }));
            return;
        }

        if (!/^[0-9]*$/.test(value)) {
            setErrors((prev) => ({ ...prev, quantity: "Only numbers allowed." }));
            return;
        }

        setQuantity(value);

        const error = validateQuantity(value);
        setErrors((prev) => ({ ...prev, quantity: error }));
    };

    const handleBranchChange = (e) => {
        const value = e.target.value;
        setBranchId(value);
        setTouched((prev) => ({ ...prev, branch: true }));

        const error = validateBranch(value);
        setErrors((prev) => ({ ...prev, branch: error }));
    };

    return (
        <div className="add-product-page">
            <FormHeader title="Edit Automated Order" to="/orders?tab=reorder" />

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

            <FormWrapper title="Edit Automated Order Details:">
                <form className="add-product-form" onSubmit={handleSubmit}>
                    {/* SUPPLIER SEARCHABLE DROPDOWN */}
                    <div
                        className="mb-3 product-input-container add-product-searchable-dropdown"
                        ref={supplierRef}
                    >
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.supplier && errors.supplier ? "is-invalid" : ""}`}
                            style={{ width: "100%" }}
                            placeholder={
                                loadingSuppliers
                                    ? "Loading suppliers..."
                                    : "Search or select supplier"
                            }
                            value={supplierQuery}
                            onChange={handleSupplierInputChange}
                            onFocus={handleSupplierInputFocus}
                            onKeyDown={handleSupplierKeyDown}
                            disabled={loadingSuppliers}
                            autoComplete="off"
                        />

                        {showSupplierDropdown && filteredSuppliers.length > 0 && (
                            <ul className="add-product-dropdown-list">
                                {filteredSuppliers.map((s, idx) => (
                                    <li
                                        key={s.value}
                                        className={`add-product-dropdown-item ${idx === supplierHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => ev.preventDefault()}
                                        onClick={() => handleSelectSupplier(s)}
                                        onMouseEnter={() => setSupplierHighlightIndex(idx)}
                                    >
                                        {s.supplierName}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {touched.supplier && errors.supplier && (
                            <div className="invalid-feedback d-block">
                                {errors.supplier}
                            </div>
                        )}
                    </div>

                    {/* PRODUCT SEARCHABLE DROPDOWN */}
                    <div
                        className="mb-3 product-input-container add-product-searchable-dropdown"
                        ref={productRef}
                    >
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.product && errors.product ? "is-invalid" : ""}`}
                            style={{ width: "100%" }}
                            placeholder={
                                !supplierId
                                    ? "Select a supplier first"
                                    : loadingProducts
                                        ? "Loading products..."
                                        : "Search or select product"
                            }
                            value={productQuery}
                            onChange={handleProductInputChange}
                            onFocus={handleProductInputFocus}
                            onKeyDown={handleProductKeyDown}
                            disabled={!supplierId || loadingProducts}
                            autoComplete="off"
                        />

                        {showProductDropdown && filteredProducts.length > 0 && (
                            <ul className="add-product-dropdown-list">
                                {filteredProducts.map((p, idx) => (
                                    <li
                                        key={p.value}
                                        className={`add-product-dropdown-item ${idx === productHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => ev.preventDefault()}
                                        onClick={() => handleSelectProduct(p)}
                                        onMouseEnter={() => setProductHighlightIndex(idx)}
                                    >
                                        {p.productName}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {touched.product && errors.product && (
                            <div className="invalid-feedback d-block">
                                {errors.product}
                            </div>
                        )}
                    </div>

                    {/* THRESHOLD */}
                    <div className="mb-3 product-input-container">
                        <input
                            type="text"
                            className={`form-control form-text-input w-100 ${touched.threshold && errors.threshold ? "is-invalid" : ""}`}
                            placeholder="Threshold"
                            value={threshold}
                            onChange={handleThresholdChange}
                        />
                        {touched.threshold && errors.threshold && (
                            <div className="invalid-feedback d-block">
                                {errors.threshold}
                            </div>
                        )}
                    </div>

                    {/* QUANTITY */}
                    <div className="mb-3 product-input-container">
                        <input
                            type="text"
                            className={`form-control form-text-input w-100 ${touched.quantity && errors.quantity ? "is-invalid" : ""}`}
                            placeholder="Quantity"
                            value={quantity}
                            onChange={handleQuantityChange}
                        />
                        {touched.quantity && errors.quantity && (
                            <div className="invalid-feedback d-block">
                                {errors.quantity}
                            </div>
                        )}
                    </div>

                    {/* BRANCH DROPDOWN */}
                    {isAdmin && (
                        <div className="mb-3 product-input-container">
                            <select
                                className={`form-control form-text-input ${touched.branch && errors.branch ? "is-invalid" : ""}`}
                                style={{ width: "100%" }}
                                value={branchId}
                                onChange={handleBranchChange}
                                disabled={loadingBranches}
                            >
                                <option value="">
                                    {loadingBranches ? "Loading branches..." : "Select Branch"}
                                </option>
                                {branchOptions.map((opt, idx) => (
                                    <option key={idx} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {touched.branch && errors.branch && (
                                <div className="invalid-feedback d-block">
                                    {errors.branch}
                                </div>
                            )}
                        </div>
                    )}

                    <AddButton text="Save Changes" type="submit" icon="file-earmark-check" />
                </form>
            </FormWrapper>
        </div>
    );
}