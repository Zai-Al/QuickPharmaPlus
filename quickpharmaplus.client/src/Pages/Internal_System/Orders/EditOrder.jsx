import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateOrder.css";
import "../Products/AddProduct.css"; // Import AddProduct CSS for consistency

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";
import { AuthContext } from "../../../Context/AuthContext";

export default function EditOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_BASE_URL || "https://localhost:7231";
    const { user } = useContext(AuthContext);

    // ===================== STATE =====================
    const [supplierId, setSupplierId] = useState("");
    const [productId, setProductId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [branchId, setBranchId] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);

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
        // Always fetch suppliers
        fetchSuppliers();
        
        // Fetch branches if user is admin
        if (isAdmin) {
            fetchBranches();
        }

        // Fetch order details
        fetchOrderDetails();
    }, [id, isAdmin]); // Dependency on id and isAdmin

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

    // =================== FETCH ORDER DETAILS ===================
    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${baseURL}/api/SupplierOrder/${id}`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch order details");

            const data = await response.json();

            setSupplierId(data.supplierId?.toString() || "");
            setProductId(data.productId?.toString() || "");
            setQuantity(data.supplierOrderQuantity?.toString() || "");
            setBranchId(data.branchId?.toString() || "");

            // Set supplier query after suppliers are loaded
            if (data.supplierName) {
                setSupplierQuery(data.supplierName);
            }

            // Set product query after products are loaded
            if (data.productName) {
                setProductQuery(data.productName);
            }

        } catch (err) {
            console.error("Error fetching order details:", err);
            setErrorMessage("Failed to load order details.");
        } finally {
            setLoading(false);
        }
    };

    // Update supplier query when supplierId and supplierOptions are available
    useEffect(() => {
        if (supplierId && supplierOptions.length > 0) {
            const selectedSupplier = supplierOptions.find(s => s.value.toString() === supplierId.toString());
            if (selectedSupplier) {
                setSupplierQuery(selectedSupplier.supplierName);
            }
        }
    }, [supplierId, supplierOptions]);

    // Update product query when productId and productOptions are available
    useEffect(() => {
        if (productId && productOptions.length > 0) {
            const selectedProduct = productOptions.find(p => p.value.toString() === productId.toString());
            if (selectedProduct) {
                setProductQuery(selectedProduct.productName);
            }
        }
    }, [productId, productOptions]);

    // Fetch products when supplier changes
    useEffect(() => {
        if (supplierId) {
            fetchProductsForSupplier(supplierId);
        }
    }, [supplierId]);

    // =================== FETCH FUNCTIONS ===================
    const fetchSuppliers = async () => {
        try {
            setLoadingSuppliers(true);
            const response = await fetch(`${baseURL}/api/Suppliers?pageNumber=1&pageSize=200`, {
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
                `${baseURL}/api/SupplierOrder/supplier/${selectedSupplierId}/products`,
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
            const response = await fetch(`${baseURL}/api/Branch?pageNumber=1&pageSize=100`, {
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

    // =================== VALIDATION FUNCTIONS ===================
    const validateSupplier = (value) => {
        if (!value) return "Supplier must be selected.";
        return "";
    };

    const validateProduct = (value) => {
        if (!value) return "Product must be selected.";
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

    // =================== CHANGE HANDLERS WITH LIVE VALIDATION ===================
    const handleSupplierInputChange = (e) => {
        const value = e.target.value;
        setSupplierQuery(value);
        setShowSupplierDropdown(true);
        setSupplierHighlightIndex(0);
        setTouched(prev => ({ ...prev, supplier: true }));

        if (!value) {
            setSupplierId("");
            setProductId("");
            setProductQuery("");
            setProductOptions([]);
            const error = validateSupplier("");
            setErrors(prev => ({ ...prev, supplier: error, product: "" }));
        }
    };

    const handleSelectSupplier = (supplierOption) => {
        setSupplierId(supplierOption.value);
        setSupplierQuery(supplierOption.supplierName);
        setShowSupplierDropdown(false);
        setSupplierHighlightIndex(0);
        setTouched(prev => ({ ...prev, supplier: true }));

        const error = validateSupplier(supplierOption.value);
        setErrors(prev => ({ ...prev, supplier: error }));

        // Reset product selection
        setProductId("");
        setProductQuery("");
        setTouched(prev => ({ ...prev, product: false }));
        setErrors(prev => ({ ...prev, product: "" }));

        // Fetch products for selected supplier
        fetchProductsForSupplier(supplierOption.value);
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

    // Product handlers
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

    const handleSelectProduct = (productOption) => {
        setProductId(productOption.value);
        setProductQuery(productOption.productName);
        setShowProductDropdown(false);
        setProductHighlightIndex(0);
        setTouched(prev => ({ ...prev, product: true }));

        const error = validateProduct(productOption.value);
        setErrors(prev => ({ ...prev, product: error }));
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

    const handleQuantityChange = (e) => {
        const value = e.target.value;

        setTouched(prev => ({ ...prev, quantity: true }));

        // Allow empty (so user can delete)
        if (value === "") {
            setQuantity("");
            setErrors(prev => ({ ...prev, quantity: "Quantity is required." }));
            return;
        }

        // If not numeric mark invalid visually
        if (!/^[0-9]*$/.test(value)) {
            setErrors(prev => ({ ...prev, quantity: "Only numbers allowed." }));
            return;
        }

        // Valid numeric input
        setQuantity(value);

        const error = validateQuantity(value);
        setErrors(prev => ({ ...prev, quantity: error }));
    };

    const handleBranchChange = (e) => {
        const value = e.target.value;
        setBranchId(value);
        setTouched(prev => ({ ...prev, branch: true }));

        const error = validateBranch(value);
        setErrors(prev => ({ ...prev, branch: error }));
    };

    // =================== FILTERED OPTIONS ===================
    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter(s =>
            s.supplierName.toLowerCase().startsWith(supplierQuery.toLowerCase())
        )
        : supplierOptions;

    const filteredProducts = productQuery
        ? productOptions.filter(p =>
            p.productName.toLowerCase().startsWith(productQuery.toLowerCase())
        )
        : productOptions;

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        const touchedFields = {
            supplier: true,
            product: true,
            quantity: true
        };

        if (isAdmin) {
            touchedFields.branch = true;
        }

        setTouched(touchedFields);

        // Validate all fields
        const validationErrors = {
            supplier: validateSupplier(supplierId),
            product: validateProduct(productId),
            quantity: validateQuantity(quantity)
        };

        if (isAdmin) {
            validationErrors.branch = validateBranch(branchId);
        }

        setErrors(validationErrors);

        // Check if any errors exist
        const hasErrors = Object.values(validationErrors).some(error => error !== "");

        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        const payload = {
            SupplierId: parseInt(supplierId, 10),
            ProductId: parseInt(productId, 10),
            Quantity: parseInt(quantity.trim(), 10)
        };

        // Only add branchId if user is admin
        if (isAdmin && branchId) {
            payload.BranchId = parseInt(branchId, 10);
        }

        try {
            const response = await fetch(`${baseURL}/api/SupplierOrder/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Order updated successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/orders"), 1500);
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || "Failed to update order.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error updating order:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    // =================== LOADING STATE ===================
    if (loading) {
        return (
            <div className="add-product-page">
                <FormHeader title="Edit Supplier Order" to="/orders" />
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2">Loading order details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-product-page">
            {/* HEADER (Title + Cancel Button) */}
            <FormHeader title="Edit Supplier Order" to="/orders" />

            {/* ALERT MESSAGES */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible inventory-alert w-80">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible inventory-alert w-80">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setErrorMessage("")}></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Edit Order Details:">
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

                    {/* PRODUCT SEARCHABLE DROPDOWN (Only enabled when supplier is selected) */}
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

                    {/* BRANCH DROPDOWN (Only for Admin) */}
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

                    {/* BUTTON */}
                    <AddButton text="Save Changes" type="submit" icon="file-earmark-check" />
                </form>
            </FormWrapper>
        </div>
    );
}