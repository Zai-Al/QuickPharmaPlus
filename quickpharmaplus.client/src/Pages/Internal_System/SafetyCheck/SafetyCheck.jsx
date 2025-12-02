import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SafetyCheck.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import Dropdown from "../../../Components/Form/FormDropDownList";
import SearchButton from "../../../Components/Form/SearchButton";
import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function SafetyCheck() {

    const navigate = useNavigate();

    // ===================== STATE =====================
    const [firstProduct, setFirstProduct] = useState("");
    const [secondProduct, setSecondProduct] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Example options (replace with API)
    const productOptions = [
        { value: "Panadol", label: "Panadol" },
        { value: "Brufen", label: "Brufen" },
        { value: "Vitamin C", label: "Vitamin C" }
    ];

    // ===================== HANDLE SUBMIT =====================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            firstProduct,
            secondProduct
        };

        try {
            const response = await fetch("https://localhost:7231/api/SafetyCheck", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Interaction check completed!");
            } else {
                setErrorMessage("Failed to check interaction.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="safety-check-page">

            {/* HEADER */}
            <FormHeader title="Safety Check - Drug Interaction" to="/safety-check" />

            {/* SUCCESS + ERROR MESSAGES */}
            {successMessage && (
                <div className="alert alert-success alert-dismissible">
                    <button className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Success!</strong> {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="alert alert-danger alert-dismissible">
                    <button className="btn-close" data-bs-dismiss="alert"></button>
                    <strong>Error!</strong> {errorMessage}
                </div>
            )}

            <FormWrapper title="Select Products for Interaction Check">

                <form className="safety-check-form" onSubmit={handleSubmit}>

                    {/* FIRST PRODUCT */}
                    <Dropdown
                        placeholder="First Product"
                        value={firstProduct}
                        options={productOptions}
                        onChange={(e) => setFirstProduct(e.target.value)}
                    />

                    {/* SECOND PRODUCT */}
                    <Dropdown
                        placeholder="Second Product"
                        value={secondProduct}
                        options={productOptions}
                        onChange={(e) => setSecondProduct(e.target.value)}
                    />

                    {/* BUTTON */}
                    <SearchButton text="Check for Interaction"/>

                </form>
            </FormWrapper>

        </div>
    );
}
