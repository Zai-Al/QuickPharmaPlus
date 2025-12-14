import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./SafetyCheck.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import Dropdown from "../../../Components/Form/FormDropDownList";
import SearchButton from "../../../Components/Form/SearchButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function SafetyCheck() {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    // ===================== STATE =====================
    const [firstProduct, setFirstProduct] = useState("");
    const [secondProduct, setSecondProduct] = useState("");

    const [interactionResult, setInteractionResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Product options from API
    const [productOptions, setProductOptions] = useState([]);

    // ===================== SEARCHABLE DROPDOWN STATE =====================
    // First Product
    const [firstProductQuery, setFirstProductQuery] = useState("");
    const [showFirstProductDropdown, setShowFirstProductDropdown] = useState(false);
    const [firstProductHighlightIndex, setFirstProductHighlightIndex] = useState(0);
    const firstProductRef = useRef(null);

    // Second Product
    const [secondProductQuery, setSecondProductQuery] = useState("");
    const [showSecondProductDropdown, setShowSecondProductDropdown] = useState(false);
    const [secondProductHighlightIndex, setSecondProductHighlightIndex] = useState(0);
    const secondProductRef = useRef(null);

    // ===================== FETCH PRODUCTS =====================
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch(`${baseURL}/api/Products?pageNumber=1&pageSize=200`, {
                credentials: "include"
            });

            if (response.ok) {
                const data = await response.json();
                const items = data.items || [];

                const options = items.map(p => ({
                    productId: p.productId,
                    productName: p.productName
                }));

                setProductOptions(options);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
            setErrorMessage("Failed to load products.");
        }
    };

    // ===================== CLOSE DROPDOWNS ON OUTSIDE CLICK =====================
    useEffect(() => {
        const onDocClick = (e) => {
            if (firstProductRef.current && !firstProductRef.current.contains(e.target)) {
                setShowFirstProductDropdown(false);
                setFirstProductHighlightIndex(0);
            }
            if (secondProductRef.current && !secondProductRef.current.contains(e.target)) {
                setShowSecondProductDropdown(false);
                setSecondProductHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // ===================== FILTERED PRODUCTS =====================
    const filteredFirstProducts = firstProductQuery
        ? productOptions.filter(p =>
            String(p.productName ?? "").toLowerCase().startsWith(String(firstProductQuery).toLowerCase())
        )
        : productOptions;

    const filteredSecondProducts = secondProductQuery
        ? productOptions.filter(p =>
            String(p.productName ?? "").toLowerCase().startsWith(String(secondProductQuery).toLowerCase())
        )
        : productOptions;

    // ===================== FIRST PRODUCT HANDLERS =====================
    const handleFirstProductInputChange = (e) => {
        const val = e.target.value;
        setFirstProductQuery(val);
        setShowFirstProductDropdown(true);
        setFirstProductHighlightIndex(0);
        if (!val) setFirstProduct("");
    };

    const handleFirstProductInputFocus = () => {
        setShowFirstProductDropdown(true);
        setFirstProductHighlightIndex(0);
    };

    const handleFirstProductKeyDown = (e) => {
        if (!showFirstProductDropdown) return;
        const list = filteredFirstProducts || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setFirstProductHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFirstProductHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[firstProductHighlightIndex];
            if (picked) handleSelectFirstProduct(picked);
        } else if (e.key === "Escape") {
            setShowFirstProductDropdown(false);
        }
    };

    const handleSelectFirstProduct = (product) => {
        setFirstProduct(product.productId);
        setFirstProductQuery(product.productName ?? "");
        setShowFirstProductDropdown(false);
        setFirstProductHighlightIndex(0);
    };

    // ===================== SECOND PRODUCT HANDLERS =====================
    const handleSecondProductInputChange = (e) => {
        const val = e.target.value;
        setSecondProductQuery(val);
        setShowSecondProductDropdown(true);
        setSecondProductHighlightIndex(0);
        if (!val) setSecondProduct("");
    };

    const handleSecondProductInputFocus = () => {
        setShowSecondProductDropdown(true);
        setSecondProductHighlightIndex(0);
    };

    const handleSecondProductKeyDown = (e) => {
        if (!showSecondProductDropdown) return;
        const list = filteredSecondProducts || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSecondProductHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSecondProductHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[secondProductHighlightIndex];
            if (picked) handleSelectSecondProduct(picked);
        } else if (e.key === "Escape") {
            setShowSecondProductDropdown(false);
        }
    };

    const handleSelectSecondProduct = (product) => {
        setSecondProduct(product.productId);
        setSecondProductQuery(product.productName ?? "");
        setShowSecondProductDropdown(false);
        setSecondProductHighlightIndex(0);
    };

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Clear previous results
        setInteractionResult(null);
        setErrorMessage("");

        // Validation
        if (!firstProduct || !secondProduct) {
            setErrorMessage("Please select both products.");
            return;
        }

        if (firstProduct === secondProduct) {
            setErrorMessage("Please select two different products.");
            return;
        }

        setLoading(true);

        const payload = {
            productAId: parseInt(firstProduct),
            productBId: parseInt(secondProduct)
        };

        try {
            const response = await fetch(`${baseURL}/api/SafetyCheck/check-interaction`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                setInteractionResult(result);
            } else {
                const errorData = await response.json().catch(() => null);
                setErrorMessage(errorData?.message || "Failed to check interaction.");
            }
        } catch {
            setErrorMessage("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="safety-check-page">

            {/* HEADER */}
            <h2>Safety Check - Drug Interaction</h2>

            {/* FORM WRAPPER */}
            <FormWrapper title="Select Products for Interaction Check">

                <form className="safety-check-form" onSubmit={handleSubmit}>

                    {/* FIRST PRODUCT - SEARCHABLE */}
                    <div className="safety-product-dropdown" ref={firstProductRef}>
                        <input
                            type="text"
                            className="form-control safety-dropdown-input"
                            placeholder={productOptions.length === 0 ? "Loading products..." : "Search or Select First Product"}
                            value={firstProductQuery ?? ""}
                            onChange={handleFirstProductInputChange}
                            onFocus={handleFirstProductInputFocus}
                            onKeyDown={handleFirstProductKeyDown}
                            disabled={productOptions.length === 0}
                            autoComplete="off"
                        />

                        {showFirstProductDropdown && (filteredFirstProducts || []).length > 0 && (
                            <ul className="list-group position-absolute safety-dropdown-list">
                                {filteredFirstProducts.map((p, idx) => (
                                    <li
                                        key={p.productId}
                                        className={`list-group-item list-group-item-action ${idx === firstProductHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectFirstProduct(p)}
                                        onMouseEnter={() => setFirstProductHighlightIndex(idx)}
                                    >
                                        {p.productName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* SECOND PRODUCT - SEARCHABLE */}
                    <div className="safety-product-dropdown" ref={secondProductRef}>
                        <input
                            type="text"
                            className="form-control safety-dropdown-input"
                            placeholder={productOptions.length === 0 ? "Loading products..." : "Search or Select Second Product"}
                            value={secondProductQuery ?? ""}
                            onChange={handleSecondProductInputChange}
                            onFocus={handleSecondProductInputFocus}
                            onKeyDown={handleSecondProductKeyDown}
                            disabled={productOptions.length === 0}
                            autoComplete="off"
                        />

                        {showSecondProductDropdown && (filteredSecondProducts || []).length > 0 && (
                            <ul className="list-group position-absolute safety-dropdown-list">
                                {filteredSecondProducts.map((p, idx) => (
                                    <li
                                        key={p.productId}
                                        className={`list-group-item list-group-item-action ${idx === secondProductHighlightIndex ? "active" : ""}`}
                                        onMouseDown={(ev) => { ev.preventDefault(); }}
                                        onClick={() => handleSelectSecondProduct(p)}
                                        onMouseEnter={() => setSecondProductHighlightIndex(idx)}
                                    >
                                        {p.productName}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* BUTTON */}
                    <SearchButton text={loading ? "Checking..." : "Check for Interaction"} disabled={loading} />

                </form>
            </FormWrapper>

            {/* INTERACTION RESULT ALERT - Same width as form */}
            {interactionResult && (
                <div className="interaction-result-container">
                    <div className={`alert ${interactionResult.hasInteraction ? 'alert-danger' : 'alert-success'} interaction-alert`}>
                        <div className="d-flex align-items-start">
                            <div className="flex-grow-1">
                                <h5 className="alert-heading mb-2">
                                    {interactionResult.hasInteraction ? (
                                        <>
                                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                            Interaction Detected!
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            Safe to Use Together
                                        </>
                                    )}
                                </h5>
                                <p className="mb-0">{interactionResult.message}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
                <div className="interaction-result-container">
                    <div className="alert alert-danger interaction-alert">
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        <strong>Error!</strong> {errorMessage}
                    </div>
                </div>
            )}

        </div>
    );
}