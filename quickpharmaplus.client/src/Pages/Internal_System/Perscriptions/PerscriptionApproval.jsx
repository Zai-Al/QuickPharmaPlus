import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./PrescriptionApproval.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import FormHeader from "../../../Components/InternalSystem/FormHeader";
import DatePicker from "../../../Components/Form/FormDatePicker";

export default function PrescriptionApprovalForm() {
    const navigate = useNavigate();

    const { prescriptionId } = useParams();

    // =================== STATE ===================
    const [productId, setProductId] = useState("");
    const [expiryDate, setExpiryDate] = useState(null);
    const [dosage, setDosage] = useState("");
    const [quantity, setQuantity] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== PRODUCTS (SEARCHABLE) ===================
    const [productOptions, setProductOptions] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const [productQuery, setProductQuery] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [productHighlightIndex, setProductHighlightIndex] = useState(0);
    const productRef = useRef(null);

    // =================== VALIDATION PATTERNS ===================
    const quantityPattern = /^[1-9][0-9]*$/; // positive integers only, no leading zeros
    const dosagePattern = /^[A-Za-z0-9\s.+\-\/()]*$/;

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // =================== FETCH ===================
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true);
            const response = await fetch(`/api/Products?pageNumber=1&pageSize=200`, {
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

    // =================== VALIDATION ===================
    const validateProduct = (value) => {
        if (!value) return "Product must be selected.";
        return "";
    };

    const validateExpiryDate = (value) => {
        if (!value) return "Prescription expiry date is required.";

        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (selectedDate < today) {
            return "Expiry date must be today or in the future.";
        }

        return "";
    };

    const validateDosage = (value) => {
        if (!value.trim()) return "Dosage is required.";
        if (!dosagePattern.test(value.trim())) {
            return "Dosage cannot contain special characters like #, $, * etc.";
        }
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

    // =================== SEARCHABLE PRODUCT HANDLERS ===================
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

    const handleSelectProduct = (productOption) => {
        setProductId(productOption.value);
        setProductQuery(productOption.productName);
        setShowProductDropdown(false);
        setProductHighlightIndex(0);
        setTouched((prev) => ({ ...prev, product: true }));

        const error = validateProduct(productOption.value);
        setErrors((prev) => ({ ...prev, product: error }));
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

    const filteredProducts = productQuery
        ? productOptions.filter((p) =>
            p.productName.toLowerCase().startsWith(productQuery.toLowerCase())
        )
        : productOptions;

    // =================== OTHER CHANGE HANDLERS ===================
    const handleExpiryDateChange = (date) => {
        setExpiryDate(date);
        setTouched((prev) => ({ ...prev, expiryDate: true }));

        const error = validateExpiryDate(date);
        setErrors((prev) => ({ ...prev, expiryDate: error }));
    };

    const handleDosageChange = (e) => {
        const value = e.target.value;
        setDosage(value);
        setTouched((prev) => ({ ...prev, dosage: true }));

        const error = validateDosage(value);
        setErrors((prev) => ({ ...prev, dosage: error }));
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

    // =================== SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!prescriptionId) {
            setErrorMessage("Missing prescription id.");
            return;
        }

        setTouched({
            product: true,
            expiryDate: true,
            dosage: true,
            quantity: true
        });

        const validationErrors = {
            product: validateProduct(productId),
            expiryDate: validateExpiryDate(expiryDate),
            dosage: validateDosage(dosage),
            quantity: validateQuantity(quantity)
        };

        setErrors(validationErrors);

        const hasErrors = Object.values(validationErrors).some((x) => x !== "");
        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        const formattedDate = expiryDate
            ? `${expiryDate.getFullYear()}-${String(expiryDate.getMonth() + 1).padStart(2, "0")}-${String(expiryDate.getDate()).padStart(2, "0")}`
            : null;

        const payload = {
            productId: parseInt(productId, 10),
            expiryDate: formattedDate,
            dosage: dosage.trim(),
            quantity: parseInt(quantity.trim(), 10)
        };

        try {
            const response = await fetch(`/api/Prescription/${encodeURIComponent(prescriptionId)}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setSuccessMessage("Prescription approved successfully!");
                setErrorMessage("");

                setTimeout(() => navigate("/prescriptions"), 1200);
            } else {
                const text = await response.text().catch(() => "");
                setErrorMessage(text || "Failed to approve prescription.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error approving prescription:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    return (
        <div className="prescription-approval-page">
            <FormHeader title="Prescription Approval Form" to="/prescriptions" />

            {successMessage && (
                <div className="alert alert-success alert-dismissible prescription-approval-alert w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible prescription-approval-alert w-50">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setErrorMessage("")}></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Approving Prescription">
                <form className="prescription-approval-form" onSubmit={handleSubmit}>
                    {/* PRODUCT SEARCHABLE DROPDOWN */}
                    <div className="mb-3 prescription-approval-field" ref={productRef}>
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
                            <ul className="list-group position-absolute searchable-dropdown prescription-approval-dropdown">
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

                    {/* EXPIRY DATE */}
                    <div className="prescription-approval-field">
                        <DatePicker
                            selected={expiryDate}
                            onChange={handleExpiryDateChange}
                            placeholderText="Enter Expiry Date"
                            className="form-control form-text-input"
                        />
                        {touched.expiryDate && errors.expiryDate && (
                            <div className="prescription-approval-validation-text">{errors.expiryDate}</div>
                        )}
                    </div>

                    {/* DOSAGE */}
                    <div className="prescription-approval-field">
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.dosage && errors.dosage ? "is-invalid" : ""}`}
                            placeholder="Dosage (e.g., 500 MG / 50mg-100mg)"
                            value={dosage}
                            onChange={handleDosageChange}
                        />
                        {touched.dosage && errors.dosage && (
                            <div className="invalid-feedback d-block">{errors.dosage}</div>
                        )}
                    </div>

                    {/* QUANTITY */}
                    <div className="prescription-approval-field">
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.quantity && errors.quantity ? "is-invalid" : ""}`}
                            placeholder="Quantity"
                            value={quantity}
                            onChange={handleQuantityChange}
                        />
                        {touched.quantity && errors.quantity && (
                            <div className="invalid-feedback d-block">{errors.quantity}</div>
                        )}
                    </div>

                    <button type="submit" className="approve-btn-custom">
                        <i className="bi bi-check-circle" style={{ marginRight: "8px" }}></i>
                        Approve Prescription
                    </button>
                </form>
            </FormWrapper>
        </div>
    );
}
