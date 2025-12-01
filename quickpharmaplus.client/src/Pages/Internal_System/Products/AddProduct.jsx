import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddProduct.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import InputTextField from "../../../Components/Form/FormTextField";
import Dropdown from "../../../Components/Form/FormDropDownList";
import UploadPhoto from "../../../Components/Form/FormUploudButton";
import AddButton from "../../../Components/Form/FormAddButton";
import DatePicker from "../../../Components/Form/FormDatePicker";
import FormHeader from "../../../Components/InternalSystem/FormHeader";


export default function AddProduct() {

    const navigate = useNavigate();

    // ===================== STATE =====================
    const [productName, setProductName] = useState("");
    const [category, setCategory] = useState("");
    const [type, setType] = useState("");
    const [supplier, setSupplier] = useState("");
    const [ingredients, setIngredients] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [unitPrice, setUnitPrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [isControlled, setIsControlled] = useState(false);

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Example dropdown lists (replace later with API)
    const categoryOptions = [
        { value: "Medicine", label: "Medicine" },
        { value: "Supplement", label: "Supplement" },
        { value: "Vitamin", label: "Vitamin" }
    ];

    const typeOptions = [
        { value: "Tablet", label: "Tablet" },
        { value: "Syrup", label: "Syrup" },
        { value: "Injection", label: "Injection" }
    ];

    const supplierOptions = [
        { value: "Alpha Pharma", label: "Alpha Pharma" },
        { value: "MedCo", label: "MedCo" },
        { value: "HealthPlus", label: "HealthPlus" }
    ];

    const ingredientsOptions = [
        { value: "Ibuprofen", label: "Ibuprofen" },
        { value: "Paracetamol", label: "Paracetamol" },
        { value: "Vitamin C", label: "Vitamin C" }
    ];

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            productName,
            category,
            type,
            supplier,
            ingredients,
            expiryDate,
            unitPrice,
            quantity,
            isControlled
        };

        try {
            const response = await fetch("https://localhost:7231/api/Products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Product added successfully!");
                setTimeout(() => navigate("/products"), 1500);
            } else {
                setErrorMessage("Failed to add product.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="add-product-page">

            {/* HEADER (Title + Cancel Button) */}
            <FormHeader title="Add New Product Record" to="/products" />

            <FormWrapper title="Enter New Produt Details:">

                <form className="add-product-form" onSubmit={handleSubmit}>

                    {/* PRODUCT NAME */}
                    <InputTextField
                        placeholder="Product Name"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                    />

                    {/* CATEGORY */}
                    <Dropdown
                        placeholder="Category"
                        value={category}
                        options={categoryOptions}
                        onChange={(e) => setCategory(e.target.value)}
                    />

                    {/* TYPE */}
                    <Dropdown
                        placeholder="Type"
                        value={type}
                        options={typeOptions}
                        onChange={(e) => setType(e.target.value)}
                    />

                    {/* SUPPLIER */}
                    <Dropdown
                        placeholder="Supplier"
                        value={supplier}
                        options={supplierOptions}
                        onChange={(e) => setSupplier(e.target.value)}
                    />

                    {/* INGREDIENTS */}
                    <Dropdown
                        placeholder="Ingredients"
                        value={ingredients}
                        options={ingredientsOptions}
                        onChange={(e) => setIngredients(e.target.value)}
                    />


                    {/* UNIT PRICE */}
                    <InputTextField
                        placeholder="Unit Price"
                        value={unitPrice}
                        onChange={(e) => setUnitPrice(e.target.value)}
                    />

                    {/* QUANTITY */}
                    <InputTextField
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    <div className="controlled-field">
                        <span className="controlled-text">Controlled Substance</span>

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

                    {/* EXPIRY DATE */}

                    <DatePicker
                        name="expiryDate"
                        type="date"
                        className="product-input"
                        selected={expiryDate}
                        onChange={(d) => setExpiryDate(e.target.value)}
                        placeholderText="Enter Expiry Date"
                    />

                    {/* UPLOAD PRODUCT PHOTO */}
                        <UploadPhoto text="Upload Product Photo" />

                    {/* BUTTON */}
                        <AddButton text="Add New Product" type="submit" />
                </form>
            </FormWrapper>
        </div>
    );
}
