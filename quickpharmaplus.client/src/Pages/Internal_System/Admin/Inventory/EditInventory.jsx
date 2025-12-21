import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddInventory.css";

import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../../Components/Form/FormAddButton";
import FormHeader from "../../../../Components/InternalSystem/FormHeader";
import DatePicker from "../../../../Components/Form/FormDatePicker";

export default function EditInventory() {
    const { id } = useParams();
    const navigate = useNavigate();
    const baseURL = import.meta.env.VITE_API_BASE_URL;

    // =================== STATE ===================
    const [productId, setProductId] = useState("");
    const [branchId, setBranchId] = useState("");
    const [quantity, setQuantity] = useState("");
    const [expiryDate, setExpiryDate] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== DROPDOWN OPTIONS ===================
    const [productOptions, setProductOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);

    const [loadingProducts, setLoadingProducts] = useState(false);
    const [loadingBranches, setLoadingBranches] = useState(false);

    // =================== SEARCHABLE PRODUCT DROPDOWN ===================
    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productHighlightIndex, setProductHighlightIndex] = useState(0);
    const productRef = useRef(null);

    // =================== VALIDATION PATTERNS ===================
    const quantityPattern = /^[1-9][0-9]*$/; // Positive integers only, no leading zeros

    // =================== FETCH DATA ON MOUNT ===================
    useEffect(() => {
        fetchProducts();
        fetchBranches();
        fetchInventory();
    }, [id]);

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

    // =================== FETCH INVENTORY DETAILS ===================
    const fetchInventory = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${baseURL}/api/Inventory/${id}`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch inventory");

            const data = await response.json();

            setProductId(data.productId?.toString() || "");
            setBranchId(data.branchId?.toString() || "");
            setQuantity(data.quantity?.toString() || "");

            // Parse expiry date
            if (data.expiryDate) {
                const parsedDate = new Date(data.expiryDate);
                setExpiryDate(parsedDate);
            }

            // Set product query to product name after products are loaded
            if (data.productName) {
                setProductQuery(data.productName);
            }
        } catch (err) {
            console.error("Error fetching inventory:", err);
            setErrorMessage("Failed to load inventory details.");
        } finally {
            setLoading(false);
        }
    };

    // =================== FETCH FUNCTIONS ===================
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await fetch(`${baseURL}/api/Products?pageNumber=1&pageSize=200`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch products");

            const data = await response.json();
            const items = data.items || [];

            const options = items.map((p) => ({
                value: p.productId,
                label: p.productName ?? `Product ${p.productId}`,
                productName: p.productName ?? `Product ${p.productId}`
            }));

            setProductOptions(options);
        } catch (err) {
            console.error("Error fetching products:", err);
            setErrorMessage("Failed to load products.");
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
                label: b.cityName ?? `Branch ${b.branchId}`,
                branchId: b.branchId
            }));

            setBranchOptions(options);
        } catch (err) {
            console.error("Error fetching branches:", err);
            setErrorMessage("Failed to load branches.");
        } finally {
            setLoadingBranches(false);
        }
    };

    // Update product query when productId and productOptions are available
    useEffect(() => {
        if (productId && productOptions.length > 0) {
            const selectedProduct = productOptions.find(p => p.value.toString() === productId.toString());
            if (selectedProduct) {
                setProductQuery(selectedProduct.productName);
            }
        }
    }, [productId, productOptions]);

    // =================== VALIDATION FUNCTIONS ===================
    const validateProduct = (value) => {
        if (!value) return "Product must be selected.";
        return "";
    };

    const validateBranch = (value) => {
        if (!value) return "Branch must be selected.";
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

    const validateExpiryDate = (value) => {
        if (!value) return "Batch expiry date is required.";
        
        // Validate date is in the future
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return "Expiry date must be in the future.";
        }
        
        return "";
    };

    // =================== CHANGE HANDLERS WITH LIVE VALIDATION ===================
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

    const handleBranchChange = (e) => {
        const value = e.target.value;
        setBranchId(value);
        setTouched(prev => ({ ...prev, branch: true }));

        const error = validateBranch(value);
        setErrors(prev => ({ ...prev, branch: error }));
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

    const handleExpiryDateChange = (date) => {
        setExpiryDate(date);
        setTouched(prev => ({ ...prev, expiryDate: true }));

        const error = validateExpiryDate(date);
        setErrors(prev => ({ ...prev, expiryDate: error }));
    };

    // =================== FILTERED PRODUCTS ===================
    const filteredProducts = productQuery
        ? productOptions.filter(p =>
            p.productName.toLowerCase().startsWith(productQuery.toLowerCase())
        )
        : productOptions;

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched
        setTouched({
            product: true,
            branch: true,
            quantity: true,
            expiryDate: true
        });

        // Validate all fields
        const validationErrors = {
            product: validateProduct(productId),
            branch: validateBranch(branchId),
            quantity: validateQuantity(quantity),
            expiryDate: validateExpiryDate(expiryDate)
        };

        setErrors(validationErrors);

        // Check if any errors exist
        const hasErrors = Object.values(validationErrors).some(error => error !== "");

        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        // Format expiry date to YYYY-MM-DD
        const formattedDate = expiryDate 
            ? `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, "0")}-${String(expiryDate.getDate()).padStart(2, "0")}`
            : null;

        const payload = {
            ProductId: parseInt(productId, 10),
            BranchId: parseInt(branchId, 10),
            InventoryQuantity: parseInt(quantity.trim(), 10),
            InventoryExpiryDate: formattedDate
        };

        try {
            const response = await fetch(`${baseURL}/api/Inventory/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Inventory record updated successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/inventory"), 1500);
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || "Failed to update inventory record.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error updating inventory:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    // =================== LOADING STATE ===================
    if (loading) {
        return (
            <div className="add-inventory-page">
                <FormHeader title="Edit Inventory Record" to="/inventory" />
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" />
                    <p className="mt-2">Loading inventory details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-inventory-page">
            {/* HEADER (Title + Cancel Button) */}
            <FormHeader title="Edit Inventory Record" to="/inventory" />

            {/* ALERT MESSAGES */}
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

            <FormWrapper title="Edit Inventory Details:">
                <form className="add-inventory-form" onSubmit={handleSubmit}>

                    {/* PRODUCT SEARCHABLE DROPDOWN */}
                    <div className="mb-3 inventory-field" ref={productRef}>
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.product && errors.product ? "is-invalid" : ""}`}
                            style={{ width: "100%" }}
                            placeholder={loadingProducts ? "Loading products..." : "Search or select product"}
                            value={productQuery}
                            onChange={handleProductInputChange}
                            onFocus={handleProductInputFocus}
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

                    {/* BRANCH DROPDOWN */}
                    <select
                        className={`form-control form-dropdown ${touched.branch && errors.branch ? "is-invalid" : ""}`}
                        value={branchId}
                        onChange={handleBranchChange}
                        disabled={loadingBranches}
                    >
                        <option value="">{loadingBranches ? "Loading branches..." : "Select Branch"}</option>
                        {branchOptions.map((opt, idx) => (
                            <option key={idx} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                    {touched.branch && errors.branch && (
                        <div className="invalid-feedback d-block">{errors.branch}</div>
                    )}

                    {/* QUANTITY */}
                    <div className="inventory-field">
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.quantity && errors.quantity ? "is-invalid" : ""}`}
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

                    {/* EXPIRY DATE */}
                    <div className="inventory-field">
                        <DatePicker
                            selected={expiryDate}
                            onChange={handleExpiryDateChange}
                            placeholderText="Enter Batch Expiry Date"
                            className="form-control form-text-input"
                        />

                        {touched.expiryDate && errors.expiryDate && (
                            <div className="inventory-validation-text">
                                {errors.expiryDate}
                            </div>
                        )}
                    </div>

                    {/* BUTTON */}
                    <AddButton text="Save Changes" type="submit" icon="file-earmark-check" />
                </form>
            </FormWrapper>
        </div>
    );
}