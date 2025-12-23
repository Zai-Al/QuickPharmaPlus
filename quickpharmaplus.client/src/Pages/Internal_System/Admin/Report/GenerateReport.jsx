import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GenerateReport.css";

import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import Dropdown from "../../../../Components/Form/FormDropDownList";
import DatePicker from "../../../../Components/Form/FormDatePicker";
import AddButton from "../../../../Components/Form/FormAddButton";
import FormHeader from "../../../../Components/InternalSystem/FormHeader";

export default function GenerateReport() {
    const navigate = useNavigate();
    const baseURL = ""; // use Vite proxy

    // ===================== STATE =====================
    const [reportType, setReportType] = useState("");
    const [branch, setBranch] = useState("");
    const [duration, setDuration] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [supplier, setSupplier] = useState("");
    const [product, setProduct] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // ===================== DROPDOWN OPTIONS =====================
    const reportTypeOptions = [
        { value: "Sales", label: "Sales" },
        { value: "Inventory", label: "Inventory" },
        { value: "Expiry", label: "Expiry" }
    ];

    const branchOptions = [
        { value: "Manama Branch", label: "Manama Branch" },
        { value: "Muharraq Branch", label: "Muharraq Branch" },
        { value: "Isa Town Branch", label: "Isa Town Branch" }
    ];

    const productCategoryOptions = [
        { value: "Medicine", label: "Medicine" },
        { value: "Supplement", label: "Supplement" },
        { value: "Vitamin", label: "Vitamin" }
    ];

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
            reportType,
            branch,
            duration,
            productCategory,
            supplier,
            product
        };

        try {
            const response = await fetch(`${baseURL}/api/Reports/Generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Report generated successfully!");
                setTimeout(() => navigate("/reports"), 1500);
            } else {
                const body = await response.text().catch(() => "");
                setErrorMessage(body || "Failed to generate report.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="generate-report-page">

            {/* HEADER */}
            <FormHeader title="Generate New Report" to="/reports" />

            <FormWrapper title="Select Report Details:">

                <form className="generate-report-form" onSubmit={handleSubmit}>

                    {/* REPORT TYPE */}
                    <Dropdown
                        placeholder="Report Type"
                        value={reportType}
                        options={reportTypeOptions}
                        onChange={(e) => setReportType(e.target.value)}
                    />

                    {/* BRANCH */}
                    <Dropdown
                        placeholder="Branch"
                        value={branch}
                        options={branchOptions}
                        onChange={(e) => setBranch(e.target.value)}
                    />

                    {/* DURATION */}
                    <DatePicker
                        name="duration"
                        type="date"
                        className="report-input"
                        selected={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholderText="Select Duration Date"
                    />

                    {/* PRODUCT CATEGORY */}
                    <Dropdown
                        placeholder="Product Category"
                        value={productCategory}
                        options={productCategoryOptions}
                        onChange={(e) => setProductCategory(e.target.value)}
                    />

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

                    {/* BUTTON */}
                    <AddButton text="Generate Report" type="submit" />

                </form>
            </FormWrapper>
        </div>
    );
}
