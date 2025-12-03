import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateOrder.css"; // using the SAME CSS as CreateOrder

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import Dropdown from "../../../Components/Form/FormDropDownList";
import InputTextField from "../../../Components/Form/FormTextField";
import AddButton from "../../../Components/Form/FormAddButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function CreateAutomatedOrder() {

    const navigate = useNavigate();

    // ===================== STATE =====================
    const [supplier, setSupplier] = useState("");
    const [product, setProduct] = useState("");
    const [quantity, setQuantity] = useState("");
    const [threshold, setThreshold] = useState("");

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
            quantity,
            threshold
        };

        try {
            const response = await fetch("https://localhost:7231/api/AutomatedOrders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Automated order created successfully!");
                setTimeout(() => navigate("/automated-orders"), 1500);
            } else {
                setErrorMessage("Failed to create automated order.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="create-order-page">

            {/* HEADER */}
            <FormHeader title="Create Automated Order" to="/orders?tab=reorder" />

            <FormWrapper title="Enter Automated Order Details:">

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

                    {/* THRESHOLD */}
                    <InputTextField
                        placeholder="Threshold"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                    />

                    {/* BUTTON */}
                    <AddButton text="Create Automated Order" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}
