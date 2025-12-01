import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateOrder.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import Dropdown from "../../../Components/Form/FormDropDownList";
import InputTextField from "../../../Components/Form/FormTextField";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function CreateOrder() {

    const navigate = useNavigate();

    // ===================== STATE =====================
    const [supplier, setSupplier] = useState("");
    const [product, setProduct] = useState("");
    const [quantity, setQuantity] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ===================== OPTIONS =====================
    const supplierOptions = [
        { value: "Alpha Pharma", label: "Alpha Pharma" },
        { value: "MedCo", label: "MedCo" },
        { value: "HealthPlus", label: "HealthPlus" }
    ];

    const productOptions = [
        { value: "Panadol", label: "Panadol" },
        { value: "Brufen", label: "Brufen" },
        { value: "Vitamin C", label: "Vitamin C" }
    ];

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            supplier,
            product,
            quantity
        };

        try {
            const response = await fetch("https://localhost:7231/api/Orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Order created successfully!");
                setTimeout(() => navigate("/orders"), 1500);
            } else {
                setErrorMessage("Failed to create order.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="create-order-page">

            {/* HEADER */}
            <FormHeader title="Create New Order" to="/orders" />

            <FormWrapper title="Enter Order Details:">

                <form className="create-order-form" onSubmit={handleSubmit}>

                    {/* SUPPLIER */}
                    <Dropdown
                        placeholder="Supplier"
                        value={supplier}
                        options={supplierOptions}
                        onChange={(e) => setSupplier(e.target.value)}
                    />

                    {/* PRODUCT */}
                    <Dropdown
                        placeholder="Product"
                        value={product}
                        options={productOptions}
                        onChange={(e) => setProduct(e.target.value)}
                    />

                    {/* QUANTITY */}
                    <InputTextField
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    {/* BUTTON */}
                    <AddButton text="Create New Order" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}
