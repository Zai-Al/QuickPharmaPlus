import React from "react";
import "./Details.css";

export default function RejectButton({ id }) {
    const handleReject = () => {
        console.log("Rejected prescription:", id);
        // Later: send to API
    };

    return (
        <button className="reject-btn" onClick={handleReject}>
            <i className="bi bi-x-circle"></i> Reject
        </button>
    );
}
