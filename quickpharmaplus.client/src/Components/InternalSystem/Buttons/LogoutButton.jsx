import React from "react";
import "./Buttons.css";

export default function LogoutButton({ onClick }) {
    return (
        <button
            className="logout-btn"
            onClick={onClick}
        >
            Logout
        </button>
    );
}
