import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddInventory.css";

import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import InputTextField from "../../../../Components/Form/FormTextField";
import Dropdown from "../../../../Components/Form/FormDropDownList";
import DatePicker from "../../../../Components/Form/FormDatePicker";
import AddButton from "../../../../Components/Form/FormAddButton";
import FormHeader from "../../../../Components/InternalSystem/FormHeader";

export default function AddInventory() {

    const navigate = useNavigate();

    // ===================== STATE =====================
    const [product, setProduct] = useState("");
    const [branch, setBranch] = useState("");
    const [quantity, setQuantity] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Example dropdown lists (replace later with API)
    const productOptions = [
        { value: "Panadol", label: "Panadol" },
        { value: "Brufen", label: "Brufen" },
        { value: "Vitamin C", label: "Vitamin C" }
    ];

    const branchOptions = [
        { value: "Manama Branch", label: "Manama Branch" },
        { value: "Muharraq Branch", label: "Muharraq Branch" },
        { value: "Isa Town Branch", label: "Isa Town Branch" }
    ];

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            product,
            branch,
            quantity,
            expiryDate
        };

        try {
            const response = await fetch("https://localhost:7231/api/Inventory", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Inventory record added successfully!");
                setTimeout(() => navigate("/inventory"), 1500);
            } else {
                setErrorMessage("Failed to add inventory.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="add-inventory-page">

            {/* HEADER (Title + Cancel Button) */}
            <FormHeader title="Add New Inventory Record" to="/inventory" />

            <FormWrapper title="Enter New Inventory Details:">

                <form className="add-inventory-form" onSubmit={handleSubmit}>

                    {/* PRODUCT */}
                    <Dropdown
                        placeholder="Product"
                        value={product}
                        options={productOptions}
                        onChange={(e) => setProduct(e.target.value)}
                    />

                    {/* BRANCH */}
                    <Dropdown
                        placeholder="Branch"
                        value={branch}
                        options={branchOptions}
                        onChange={(e) => setBranch(e.target.value)}
                    />

                    {/* QUANTITY */}
                    <InputTextField
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    {/* EXPIRY DATE */}
                    <DatePicker
                        name="expiryDate"
                        type="date"
                        className="inventory-date-picker"
                        selected={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholderText="Enter Batch Expiry Date"
                    />

                    {/* BUTTON */}
                    <AddButton text="Add Inventory Record" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}
