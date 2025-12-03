import { useState } from "react";
import { useParams } from "react-router-dom";
import "./PrescriptionApproval.css";

import FormWrapper from "../../../Components/InternalSystem/GeneralComponents/Form";
import FormHeader from "../../../Components/InternalSystem/FormHeader";
import Dropdown from "../../../Components/Form/FormDropDownList";
import InputTextField from "../../../Components/Form/FormTextField";
import DatePicker from "../../../Components/Form/FormDatePicker";

export default function PrescriptionApprovalForm() {

    //const { id } = useParams(); // <-- GET THE PRESCRIPTION ID

    const [product, setProduct] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
    const [dosage, setDosage] = useState("");
    const [quantity, setQuantity] = useState("");

    const productOptions = [
        { value: "Panadol", label: "Panadol" },
        { value: "Ibuprofen", label: "Ibuprofen" },
        { value: "Amoxicillin", label: "Amoxicillin" }
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        // YOUR APPROVAL LOGIC HERE
        console.log("Approving prescription:", id);
        console.log({
            product,
            expiryDate,
            dosage,
            quantity
        });
    };

    return (
        <div className="prescription-approval-page">

            <FormHeader title="Prescription Approval Form" to="/prescriptions" />

            <FormWrapper title="Approving Prescription">


                <form className="prescription-approval-form" onSubmit={handleSubmit}>

                    <Dropdown
                        placeholder="Select Product"
                        value={product}
                        options={productOptions}
                        onChange={(e) => setProduct(e.target.value)}
                    />

                        <DatePicker
                            name="expiryDate"
                            type="date"
                        className="inventory-date-picker"
                        selected={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            placeholderText="Enter Expiry Date"
                        />

                    <InputTextField
                        placeholder="Dosage Instructions"
                        value={dosage}
                        onChange={(e) => setDosage(e.target.value)}
                    />

                    <InputTextField
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />

                    <button type="submit" className="approve-btn-custom">
                        <i className="bi bi-check-circle" style={{ marginRight: "8px" }}></i>
                        Approve Prescription
                    </button>

                </form>

            </FormWrapper>
        </div>
    );
}
