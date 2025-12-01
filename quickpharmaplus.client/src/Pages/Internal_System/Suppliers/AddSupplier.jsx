import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddSupplier.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import AddButton from "../../../Components/Form/FormAddButton";
import TextField from "../../../Components/Form/FormTextField";
import CityDropDown from "../../../Components/Form/CityDropDown";
import AdressInput from "../../../Components/Form/AdressField";

import FormHeader from "../../../Components/InternalSystem/FormHeader";

export default function AddSupplier() {

    const navigate = useNavigate();

    // =================== STATE ===================
    const [supplierName, setSupplierName] = useState("");
    const [repName, setRepName] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [email, setEmail] = useState("");

    const [city, setCity] = useState("");
    const [block, setBlock] = useState("");
    const [road, setRoad] = useState("");
    const [building, setBuilding] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const cityOptions = [
        { value: "Manama", label: "Manama" },
        { value: "Muharraq", label: "Muharraq" },
        { value: "Isa Town", label: "Isa Town" }
    ];

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            supplierName,
            repName,
            contactNumber,
            email,
            city,
            block,
            road,
            building
        };

        try {
            const response = await fetch("https://localhost:7231/api/Suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Supplier added successfully!");
                setTimeout(() => navigate("/suppliers"), 1500);
            } else {
                setErrorMessage("Failed to add supplier.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="add-supplier-page">

            {/* PAGE HEADER */}
            <FormHeader title="Add New Supplier Record" to="/suppliers" />

            {/* SUCCESS + ERROR */}
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

            <FormWrapper title="Enter New Supplier Details">
                <form className="add-supplier-form" onSubmit={handleSubmit}>

                    {/* SUPPLIER NAME */}
                    <TextField
                        placeholder="Supplier Name"
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                    />

                    {/* REPRESENTATIVE NAME */}
                    <TextField
                        placeholder="Representative Name"
                        value={repName}
                        onChange={(e) => setRepName(e.target.value)}
                    />

                    {/* CONTACT NUMBER */}
                    <TextField
                        placeholder="Contact Number"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                    />

                    {/* EMAIL */}
                    <TextField
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    {/* ADDRESS ROW 1 */}
                    <div className="address-row">

                        <div className="address-column">
                            <CityDropDown
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                options={cityOptions}
                                placeholder="City"
                            />
                        </div>

                        <div className="address-column">
                            <AdressInput
                                placeholder="Block"
                                value={block}
                                onChange={(e) => setBlock(e.target.value)}
                            />
                        </div>

                    </div>

                    {/* ADDRESS ROW 2 */}
                    <div className="address-row">
                        <div className="address-column">
                            <AdressInput
                                placeholder="Road"
                                value={road}
                                onChange={(e) => setRoad(e.target.value)}
                            />
                        </div>

                        <div className="address-column">
                            <AdressInput
                                placeholder="Building"
                                value={building}
                                onChange={(e) => setBuilding(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* BUTTON */}
                    <AddButton text="Add New Supplier" />

                </form>
            </FormWrapper>
        </div>
    );
}
