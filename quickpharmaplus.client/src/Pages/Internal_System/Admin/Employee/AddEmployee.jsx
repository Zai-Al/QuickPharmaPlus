import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./EmployeesList.css";

import FormWrapper from "../../../../Components/InternalSystem/GeneralComponents/Form";
import InputTextField from "../../../../Components/InternalSystem/GeneralComponents/InputTextField";
import Dropdown from "../../../../Components/InternalSystem/GeneralComponents/FilterDropDown";
import CityDropDown from "../../../../Components/InternalSystem/GeneralComponents/CityDropDown";

import AddButton from "../../../../Components/InternalSystem/Buttons/AddButton";
import CancelButton from "../../../../Components/InternalSystem/Buttons/CancelButton";

export default function AddEmployee() {
    const navigate = useNavigate();

    // =================== STATE ===================
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [email, setEmail] = useState("");
    const [tempPassword, setTempPassword] = useState("");
    const [phone, setPhone] = useState("");

    const [city, setCity] = useState("");
    const [block, setBlock] = useState("");
    const [road, setRoad] = useState("");
    const [building, setBuilding] = useState("");

    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    // Example dropdown lists  
    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Manager", label: "Manager" },
        { value: "Pharmacist", label: "Pharmacist" },
        { value: "Driver", label: "Driver" }
    ];

    const cityOptions = [
        { value: "Manama", label: "Manama" },
        { value: "Muharraq", label: "Muharraq" },
        { value: "Isa Town", label: "Isa Town" }
    ];

    // =================== HANDLE SUBMIT ===================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name,
            role,
            email,
            tempPassword,
            phone,
            city,
            block,
            road,
            building
        };

        try {
            const response = await fetch("https://localhost:7231/api/Employees", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setSuccessMessage("Employee added successfully!");
                setTimeout(() => navigate("/employees"), 1500);
            } else {
                setErrorMessage("Failed to add employee.");
            }
        } catch {
            setErrorMessage("Server error.");
        }
    };

    return (
        <div className="add-employee-page">
            <div className="add-employee-header">
                <CancelButton to="/employees" text="Cancel" />
            </div>


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

            <FormWrapper title="Add New Employee Record ">
                <form className="add-employee-form" onSubmit={handleSubmit}>

                    {/* FULL WIDTH FIELDS */}
                    <InputTextField 
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="form-control"
                    />

                    <Dropdown
                        placeholder="Role"
                        options={roleOptions}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="form-control"
                    />

                    <InputTextField
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="form-control"
                    />

                    <InputTextField
                        placeholder="Temporary Password"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        className="form-control"
                    />

                    <InputTextField
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="form-control"
                    />

                    {/* 2-IN-A-ROW (CITY + BLOCK) */}
                    {/* ADDRESS SECTION — TWO PER ROW */}
                    <div className="address-row">
                        <div className="city-wrapper">
                            <CityDropDown
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                options={cityOptions}
                                placeholder="City"
                            />
                        </div>




                        <InputTextField
                            placeholder="Block"
                            value={block}
                            onChange={(e) => setBlock(e.target.value)}
                            className="form-control address-input"
                        />
                    </div>

                    <div className="address-row">
                        <InputTextField
                            placeholder="Road"
                            value={road}
                            onChange={(e) => setRoad(e.target.value)}
                            className="form-control address-input"
                        />

                        <InputTextField
                            placeholder="Building/Flat"
                            value={building}
                            onChange={(e) => setBuilding(e.target.value)}
                            className="form-control address-input"
                        />
                    </div>


                    <div className="add-btn-wrapper">
                        <AddButton text="Add New Employee" type="submit" />
                    </div>
                </form>
            </FormWrapper>
        </div>
    );
}
