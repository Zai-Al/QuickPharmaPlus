import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AddProduct.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import UploadButton from "../../../Components/Form/FormUploudButton";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";
import ImagePreview from "../../../Components/InternalSystem/GeneralComponents/ImagePreview";

export default function AddProduct() {
    const navigate = useNavigate();

    // ===================== STATE =====================
    const [productName, setProductName] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [typeId, setTypeId] = useState("");
    const [supplierId, setSupplierId] = useState("");
    const [description, setDescription] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [isControlled, setIsControlled] = useState(false);
    const [productImage, setProductImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // =================== VALIDATION STATE ===================
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    // =================== DROPDOWN OPTIONS ===================
    const [categoryOptions, setCategoryOptions] = useState([]);
    const [typeOptions, setTypeOptions] = useState([]);
    const [supplierOptions, setSupplierOptions] = useState([]);
    const [ingredientOptions, setIngredientOptions] = useState([]);

    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [loadingIngredients, setLoadingIngredients] = useState(false);

    // =================== SEARCHABLE SUPPLIER DROPDOWN ===================
    const [supplierQuery, setSupplierQuery] = useState("");
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [supplierHighlightIndex, setSupplierHighlightIndex] = useState(0);
    const supplierRef = useRef(null);

    // =================== SEARCHABLE CATEGORY DROPDOWN ===================
    const [categoryQuery, setCategoryQuery] = useState("");
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categoryHighlightIndex, setCategoryHighlightIndex] = useState(0);
    const categoryRef = useRef(null);

    // =================== SEARCHABLE INGREDIENT DROPDOWN (MULTI-SELECT) ===================
    const [selectedIngredients, setSelectedIngredients] = useState([]);
    const [ingredientQuery, setIngredientQuery] = useState("");
    const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);
    const [ingredientHighlightIndex, setIngredientHighlightIndex] = useState(0);
    const ingredientRef = useRef(null);

    // =================== VALIDATION PATTERNS ===================
    const namePattern = /^[A-Za-z0-9 .,+\-&/%/]*$/;
    const pricePattern = /^\d+(\.\d{1,2})?$/;

    // =================== FETCH DATA ON MOUNT ===================
    useEffect(() => {
        fetchCategories();
        fetchSuppliers();
        fetchIngredients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    // Close category dropdown on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (categoryRef.current && !categoryRef.current.contains(e.target)) {
                setShowCategoryDropdown(false);
                setCategoryHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // Close ingredient dropdown on outside click
    useEffect(() => {
        const onDocClick = (e) => {
            if (ingredientRef.current && !ingredientRef.current.contains(e.target)) {
                setShowIngredientDropdown(false);
                setIngredientHighlightIndex(0);
            }
        };
        document.addEventListener("mousedown", onDocClick);
        return () => document.removeEventListener("mousedown", onDocClick);
    }, []);

    // =================== IMAGE UPLOAD HANDLER ===================
    const handleUpload = (file) => {
        setProductImage(file);
        if (file) {
            const previewURL = URL.createObjectURL(file);
            setPreviewImage(previewURL);
        }
    };

    // =================== FETCH FUNCTIONS ===================
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await fetch(`/api/Category?pageNumber=1&pageSize=200`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch categories");

            const data = await response.json();
            const items = data.items || [];

            const options = items.map((c) => ({
                value: c.categoryId,
                label: c.categoryName ?? `Category ${c.categoryId}`,
                categoryName: c.categoryName ?? `Category ${c.categoryId}`
            }));

            setCategoryOptions(options);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setErrorMessage("Failed to load categories.");
        } finally {
            setLoadingCategories(false);
        }
    };

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

    const fetchIngredients = async () => {
        try {
            setLoadingIngredients(true);
            const response = await fetch(`/api/Ingredients?pageNumber=1&pageSize=500`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch ingredients");

            const data = await response.json();
            const items = data.items || [];

            const options = items.map((i) => ({
                value: i.ingredientId,
                label: i.ingredientName ?? `Ingredient ${i.ingredientId}`,
                ingredientName: i.ingredientName ?? `Ingredient ${i.ingredientId}`
            }));

            setIngredientOptions(options);
        } catch (err) {
            console.error("Error fetching ingredients:", err);
            setErrorMessage("Failed to load ingredients.");
        } finally {
            setLoadingIngredients(false);
        }
    };

    const fetchTypesForCategory = async (catId) => {
        try {
            setLoadingTypes(true);
            const response = await fetch(`/api/Category/types/${catId}?pageNumber=1&pageSize=200`, {
                credentials: "include"
            });

            if (!response.ok) throw new Error("Failed to fetch types");

            const data = await response.json();
            const items = data.items || [];

            const options = items.map((t) => ({
                value: t.productTypeId,
                label: t.productTypeName ?? `Type ${t.productTypeId}`
            }));

            setTypeOptions(options);
        } catch (err) {
            console.error("Error fetching types:", err);
            setErrorMessage("Failed to load product types.");
        } finally {
            setLoadingTypes(false);
        }
    };

    // =================== CHECK DUPLICATE NAME ===================
    const checkDuplicateName = async (name) => {
        const trimmed = (name ?? "").trim();
        if (!trimmed || trimmed.length < 3) return;

        // if pattern invalid, do not run duplicate check
        if (!namePattern.test(trimmed)) return;

        try {
            const response = await fetch(
                `/api/Products/check-name?name=${encodeURIComponent(trimmed)}`,
                { credentials: "include" }
            );

            if (!response.ok) return;

            const data = await response.json();
            setErrors(prev => ({
                ...prev,
                productName: data.exists ? "A product with this name already exists in the system." : ""
            }));
        } catch (error) {
            console.error("Error checking duplicate name:", error);
        }
    };

    // =================== VALIDATION FUNCTIONS ===================
    const validateProductName = (value) => {
        if (!value.trim()) return "Product name is required.";
        if (value.trim().length < 3) return "Product name must be at least 3 characters.";
        if (!namePattern.test(value.trim())) {
            return "Product name may only contain letters, numbers, spaces, dots, commas, dashes, plus signs, ampersands (&), slashes (/), and percent signs (%).";
        }
        return "";
    };

    const validateDescription = (value) => {
        if (!value.trim()) return "Description is required.";
        if (value.trim().length < 3) return "Description must be at least 3 characters.";
        return "";
    };

    const validateSupplier = (value) => {
        if (!value) return "Supplier must be selected.";
        return "";
    };

    const validateCategory = (value) => {
        if (!value) return "Category must be selected.";
        return "";
    };

    const validateType = (value) => {
        if (!value) return "Product type must be selected.";
        return "";
    };

    const validateUnitPrice = (value) => {
        if (!value.trim()) return "Unit price is required.";
        if (!pricePattern.test(value.trim())) {
            return "Unit price must be a valid number (e.g., 10 or 10.50).";
        }
        const num = parseFloat(value.trim());
        if (num <= 0) return "Unit price must be greater than 0.";
        return "";
    };

    // Ingredients are optional (devices / band aids etc.)
    const validateIngredients = (_ingredients) => "";

    // =================== CHANGE HANDLERS WITH LIVE VALIDATION ===================
    const handleProductNameChange = (e) => {
        const value = e.target.value;

        if (!namePattern.test(value)) {
            setErrors(prev => ({
                ...prev,
                productName: "Product name may only contain letters, numbers, spaces, dots, commas, dashes, plus signs, ampersands (&), slashes (/), and percent signs (%)."
            }));
            setTouched(prev => ({ ...prev, productName: true }));
            return;
        }

        setProductName(value);
        setTouched(prev => ({ ...prev, productName: true }));

        const error = validateProductName(value);
        setErrors(prev => ({ ...prev, productName: error }));
    };

    const handleDescriptionChange = (e) => {
        const value = e.target.value;
        setDescription(value);
        setTouched(prev => ({ ...prev, description: true }));

        const error = validateDescription(value);
        setErrors(prev => ({ ...prev, description: error }));
    };

    // Supplier handlers
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

    const handleSelectSupplier = (supplierOption) => {
        setSupplierId(supplierOption.value);
        setSupplierQuery(supplierOption.supplierName);
        setShowSupplierDropdown(false);
        setSupplierHighlightIndex(0);
        setTouched(prev => ({ ...prev, supplier: true }));

        const error = validateSupplier(supplierOption.value);
        setErrors(prev => ({ ...prev, supplier: error }));
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

    // Category handlers
    const handleCategoryInputChange = (e) => {
        const value = e.target.value;
        setCategoryQuery(value);
        setShowCategoryDropdown(true);
        setCategoryHighlightIndex(0);
        setTouched(prev => ({ ...prev, category: true }));

        if (!value) {
            setCategoryId("");
            setTypeId("");
            setTypeOptions([]);
            const error = validateCategory("");
            setErrors(prev => ({ ...prev, category: error, type: "" }));
        }
    };

    const handleSelectCategory = (categoryOption) => {
        setCategoryId(categoryOption.value);
        setCategoryQuery(categoryOption.categoryName);
        setShowCategoryDropdown(false);
        setCategoryHighlightIndex(0);
        setTouched(prev => ({ ...prev, category: true }));

        // Reset type selection when category changes
        setTypeId("");
        setErrors(prev => ({ ...prev, type: "" }));
        setTouched(prev => ({ ...prev, type: false }));

        const error = validateCategory(categoryOption.value);
        setErrors(prev => ({ ...prev, category: error }));

        // Fetch types for selected category
        fetchTypesForCategory(categoryOption.value);
    };

    const handleCategoryInputFocus = () => {
        setShowCategoryDropdown(true);
        setCategoryHighlightIndex(0);
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

    const handleTypeChange = (e) => {
        const value = e.target.value;
        setTypeId(value);
        setTouched(prev => ({ ...prev, type: true }));

        const error = validateType(value);
        setErrors(prev => ({ ...prev, type: error }));
    };

    const handleUnitPriceChange = (e) => {
        const value = e.target.value;
        setUnitPrice(value);
        setTouched(prev => ({ ...prev, unitPrice: true }));

        const error = validateUnitPrice(value);
        setErrors(prev => ({ ...prev, unitPrice: error }));
    };

    // =================== INGREDIENT HANDLERS (MULTI-SELECT) ===================
    const handleIngredientInputChange = (e) => {
        const value = e.target.value;
        setIngredientQuery(value);
        setShowIngredientDropdown(true);
        setIngredientHighlightIndex(0);
    };

    const handleSelectIngredient = (ingredientOption) => {
        const isAlreadySelected = selectedIngredients.some(
            ing => ing.value === ingredientOption.value
        );

        if (!isAlreadySelected) {
            const newSelectedIngredients = [...selectedIngredients, ingredientOption];
            setSelectedIngredients(newSelectedIngredients);
            setTouched(prev => ({ ...prev, ingredients: true }));

            const error = validateIngredients(newSelectedIngredients);
            setErrors(prev => ({ ...prev, ingredients: error }));

            const displayValue = newSelectedIngredients
                .map(ing => ing.ingredientName)
                .join(", ");

            setIngredientQuery(displayValue.length > 0 ? displayValue + ", " : "");
        }

        setShowIngredientDropdown(false);
        setIngredientHighlightIndex(0);
    };

    const handleRemoveIngredient = (ingredientToRemove) => {
        const newSelectedIngredients = selectedIngredients.filter(
            ing => ing.value !== ingredientToRemove.value
        );
        setSelectedIngredients(newSelectedIngredients);
        setTouched(prev => ({ ...prev, ingredients: true }));

        const error = validateIngredients(newSelectedIngredients);
        setErrors(prev => ({ ...prev, ingredients: error }));

        const displayValue = newSelectedIngredients
            .map(ing => ing.ingredientName)
            .join(", ");

        setIngredientQuery(displayValue.length > 0 ? displayValue + ", " : "");
    };

    const handleIngredientInputFocus = () => {
        setShowIngredientDropdown(true);
        setIngredientHighlightIndex(0);
    };

    const handleIngredientKeyDown = (e) => {
        if (!showIngredientDropdown) return;
        const list = filteredIngredients || [];
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setIngredientHighlightIndex(i => Math.min(i + 1, list.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIngredientHighlightIndex(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const picked = list[ingredientHighlightIndex];
            if (picked) handleSelectIngredient(picked);
        } else if (e.key === "Escape") {
            setShowIngredientDropdown(false);
        } else if (e.key === "Backspace") {
            const trimmed = ingredientQuery.trimEnd();
            if (trimmed.endsWith(",") && selectedIngredients.length > 0) {
                e.preventDefault();
                const lastIngredient = selectedIngredients[selectedIngredients.length - 1];
                handleRemoveIngredient(lastIngredient);
            }
        }
    };

    // =================== HELPER: Get current search term (after last comma) ===================
    const getCurrentSearchTerm = () => {
        const parts = ingredientQuery.split(",");
        const lastPart = parts[parts.length - 1].trim();
        return lastPart;
    };

    // =================== FILTERED OPTIONS ===================
    const filteredSuppliers = supplierQuery
        ? supplierOptions.filter(s =>
            s.supplierName.toLowerCase().startsWith(supplierQuery.toLowerCase())
        )
        : supplierOptions;

    const filteredCategories = categoryQuery
        ? categoryOptions.filter(c =>
            c.categoryName.toLowerCase().startsWith(categoryQuery.toLowerCase())
        )
        : categoryOptions;

    const currentSearchTerm = getCurrentSearchTerm();

    const filteredIngredients = currentSearchTerm
        ? ingredientOptions.filter(i =>
            i.ingredientName.toLowerCase().startsWith(currentSearchTerm.toLowerCase()) &&
            !selectedIngredients.some(selected => selected.value === i.value)
        )
        : ingredientOptions.filter(i =>
            !selectedIngredients.some(selected => selected.value === i.value)
        );

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mark all fields as touched (ingredients no longer required)
        setTouched({
            productName: true,
            supplier: true,
            category: true,
            type: true,
            description: true,
            unitPrice: true,
            ingredients: true
        });

        // Validate all fields
        const validationErrors = {
            productName: validateProductName(productName),
            supplier: validateSupplier(supplierId),
            category: validateCategory(categoryId),
            type: validateType(typeId),
            description: validateDescription(description),
            unitPrice: validateUnitPrice(unitPrice),
            ingredients: validateIngredients(selectedIngredients)
        };

        setErrors(validationErrors);

        const hasErrors = Object.values(validationErrors).some(error => error !== "");

        if (hasErrors) {
            setErrorMessage("All fields must be filled properly. Please check the errors above.");
            setSuccessMessage("");
            return;
        }

        const formData = new FormData();
        formData.append("ProductName", productName.trim());
        formData.append("ProductDescription", description.trim());
        formData.append("SupplierId", parseInt(supplierId, 10));
        formData.append("CategoryId", parseInt(categoryId, 10));
        formData.append("ProductTypeId", parseInt(typeId, 10));
        formData.append("ProductPrice", parseFloat(unitPrice.trim()));
        formData.append("IsControlled", isControlled);

        // Ingredient IDs are optional now
        selectedIngredients.forEach((ingredient, index) => {
            formData.append(`IngredientIds[${index}]`, ingredient.value);
        });

        if (productImage) {
            formData.append("ProductImage", productImage);
        }

        try {
            const response = await fetch(`/api/Products`, {
                method: "POST",
                body: formData,
                credentials: "include"
            });

            if (response.ok) {
                setSuccessMessage("Product added successfully!");
                setErrorMessage("");
                setTimeout(() => navigate("/products"), 1500);
            } else if (response.status === 409) {
                setErrorMessage("A product with this name already exists in the system.");
                setErrors(prev => ({
                    ...prev,
                    productName: "A product with this name already exists in the system."
                }));
                setSuccessMessage("");
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || "Failed to add product.");
                setSuccessMessage("");
            }
        } catch (err) {
            console.error("Error adding product:", err);
            setErrorMessage("Server error. Please try again.");
            setSuccessMessage("");
        }
    };

    return (
        <div className="add-product-page">
            {/* HEADER (Title + Cancel Button) */}
            <FormHeader title="Add New Product Record" to="/products" />

            {/* ALERT MESSAGES */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible inventory-alert">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setSuccessMessage("")}></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible inventory-alert">
                    <button className="btn-close" data-bs-dismiss="alert" onClick={() => setErrorMessage("")}></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Enter New Product Details:">
                <form className="add-product-form" onSubmit={handleSubmit}>

                    {/* IMAGE PREVIEW - ONLY SHOW WHEN IMAGE EXISTS */}
                    {previewImage && (
                        <div className="product-image-preview-container">
                            <div className="product-image-preview-wrapper">
                                <ImagePreview src={previewImage} />
                            </div>
                        </div>
                    )}

                    {/* PRODUCT NAME */}
                    <div className="mb-3 product-input-container">
                        <input
                            type="text"
                            className={`form-control product-name-input form-text-input ${touched.productName && errors.productName ? "is-invalid" : ""}`}
                            placeholder="Enter Product Name"
                            value={productName}
                            onChange={handleProductNameChange}
                            onBlur={() => {
                                setTouched(prev => ({ ...prev, productName: true }));
                                checkDuplicateName(productName);
                            }}
                        />
                        {touched.productName && errors.productName && (
                            <div className="invalid-feedback d-block">{errors.productName}</div>
                        )}
                    </div>

                    {/* SUPPLIER SEARCHABLE DROPDOWN */}
                    <div
                        className="mb-3 product-input-container add-product-searchable-dropdown"
                        ref={supplierRef}
                    >
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.supplier && errors.supplier ? "is-invalid" : ""
                                }`}
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
                                        className={`add-product-dropdown-item ${idx === supplierHighlightIndex ? "active" : ""
                                            }`}
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

                    {/* CATEGORY SEARCHABLE DROPDOWN */}
                    <div
                        className="mb-3 product-input-container add-product-searchable-dropdown"
                        ref={categoryRef}
                    >
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.category && errors.category ? "is-invalid" : ""
                                }`}
                            style={{ width: "100%" }}
                            placeholder={
                                loadingCategories
                                    ? "Loading categories..."
                                    : "Search or select category"
                            }
                            value={categoryQuery}
                            onChange={handleCategoryInputChange}
                            onFocus={handleCategoryInputFocus}
                            onKeyDown={handleCategoryKeyDown}
                            disabled={loadingCategories}
                            autoComplete="off"
                        />

                        {showCategoryDropdown && filteredCategories.length > 0 && (
                            <ul className="add-product-dropdown-list">
                                {filteredCategories.map((c, idx) => (
                                    <li
                                        key={c.value}
                                        className={`add-product-dropdown-item ${idx === categoryHighlightIndex ? "active" : ""
                                            }`}
                                        onMouseDown={(ev) => ev.preventDefault()}
                                        onClick={() => handleSelectCategory(c)}
                                        onMouseEnter={() => setCategoryHighlightIndex(idx)}
                                    >
                                        {c.categoryName}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {touched.category && errors.category && (
                            <div className="invalid-feedback d-block">
                                {errors.category}
                            </div>
                        )}
                    </div>

                    {/* TYPE DROPDOWN (Only enabled when category is selected) */}
                    <div className="mb-3 product-input-container add-product-searchable-dropdown">
                        <select
                            className={`form-control form-text-input ${touched.type && errors.type ? "is-invalid" : ""
                                }`}
                            style={{ width: "100%" }}
                            value={typeId}
                            onChange={handleTypeChange}
                            disabled={!categoryId || loadingTypes}
                        >
                            <option value="">
                                {!categoryId
                                    ? "Select a category first"
                                    : loadingTypes
                                        ? "Loading types..."
                                        : "Select Product Type"}
                            </option>

                            {typeOptions.map((opt, idx) => (
                                <option key={idx} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>

                        {touched.type && errors.type && (
                            <div className="invalid-feedback d-block">
                                {errors.type}
                            </div>
                        )}
                    </div>


                    {/* INGREDIENT SEARCHABLE MULTI-SELECT DROPDOWN */}
                    <div className="mb-3 product-input-container add-product-searchable-dropdown" ref={ingredientRef}>
                        <input
                            type="text"
                            className={`form-control form-text-input ${touched.ingredients && errors.ingredients ? "is-invalid" : ""}`}
                            style={{ width: "100%" }}
                            placeholder={
                                loadingIngredients
                                    ? "Loading ingredients..."
                                    : selectedIngredients.length > 0
                                        ? "Add more ingredients..."
                                        : "Search or select active ingredients"
                            }
                            value={ingredientQuery}
                            onChange={handleIngredientInputChange}
                            onFocus={handleIngredientInputFocus}
                            onKeyDown={handleIngredientKeyDown}
                            disabled={loadingIngredients}
                            autoComplete="off"
                        />

                        {showIngredientDropdown && filteredIngredients.length > 0 && (
                            <ul className="add-product-dropdown-list">
                                {filteredIngredients.map((i, idx) => {
                                    const isSelected = selectedIngredients.some(
                                        selected => selected.value === i.value
                                    );

                                    return (
                                        <li
                                            key={i.value}
                                            className={`add-product-dropdown-item ${idx === ingredientHighlightIndex ? "active" : ""
                                                } ${isSelected ? "selected" : ""}`}
                                            onMouseDown={(ev) => ev.preventDefault()}
                                            onClick={() => handleSelectIngredient(i)}
                                            onMouseEnter={() => setIngredientHighlightIndex(idx)}
                                        >
                                            {i.ingredientName}
                                            {isSelected && (
                                                <span className="checkmark">✓</span>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}

                        {touched.ingredients && errors.ingredients && (
                            <div className="invalid-feedback d-block">
                                {errors.ingredients}
                            </div>
                        )}

                        {/* Display selected ingredients count (only if more than 0) */}
                        {selectedIngredients.length > 0 && (
                            <div className="selected-ingredients-count">
                                {selectedIngredients.length} ingredient{selectedIngredients.length > 1 ? "s" : ""} selected
                            </div>
                        )}
                    </div>



                    {/* DESCRIPTION */}
                    <div className="mb-3 product-input-container">
                        <textarea
                            className={`form-control form-text-input w-100${touched.description && errors.description ? "is-invalid" : ""}`}
                            placeholder="Product Description"
                            value={description}
                            onChange={handleDescriptionChange}
                            rows="4"
                            style={{ resize: "vertical", width:"100%" }}
                        />
                        {touched.description && errors.description && (
                            <div className="invalid-feedback d-block">{errors.description}</div>
                        )}
                    </div>

                    {/* UNIT PRICE */}
                    <div className="mb-3 product-input-container">
                        <input
                            type="text"
                            className={`form-control product-name-input form-text-input ${touched.unitPrice && errors.unitPrice ? "is-invalid" : ""}`}
                            placeholder="Unit Price"
                            value={unitPrice}
                            onChange={handleUnitPriceChange}
                        />
                        {touched.unitPrice && errors.unitPrice && (
                            <div className="invalid-feedback d-block">{errors.unitPrice}</div>
                        )}
                    </div>

                    {/* CONTROLLED SUBSTANCE CHECKBOX */}
                    <div className="controlled-field">
                        <span className="controlled-text form-text-input">Controlled Substance</span>

                        <div className="form-check">
                            <input
                                className="form-check-input controlled-checkbox"
                                type="checkbox"
                                id="controlledCheck"
                                checked={isControlled}
                                onChange={(e) => setIsControlled(e.target.checked)}
                            />
                        </div>
                    </div>

                    {/* UPLOAD PRODUCT PHOTO */}
                    <UploadButton
                        text="Upload Product Photo"
                        onUpload={handleUpload}
                    />

                    {/* BUTTON */}
                    <AddButton text="Add New Product" type="submit" />
                </form>
            </FormWrapper>
        </div>
    );
}
