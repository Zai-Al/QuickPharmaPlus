import React from "react";
import { useNavigate } from "react-router-dom";
import "./Details.css";

export default function ApproveButton({ id }) {
    const navigate = useNavigate();

    const handleApprove = () => {
        // navigate(`/prescriptions/approve/${id}`); // <-- DISABLED (ID not implemented yet)

        // TEMPORARY: navigate without ID
        navigate("/prescriptions/approve");
    };

    return (
        <button className="approve-btn" onClick={handleApprove}>
            <i className="bi bi-check-circle"></i> Approve
        </button>
    );
}
