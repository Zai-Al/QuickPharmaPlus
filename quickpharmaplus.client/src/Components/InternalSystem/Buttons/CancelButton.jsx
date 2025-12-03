import { useNavigate } from "react-router-dom";
import "./CancelButton.css";

export default function CancelButton({ text = "Cancel", to }) {
    const navigate = useNavigate();

    return (
        <button
            className="internal-cancel-btn"
            onClick={() => navigate(to)}
            type="button"
        >
            <i className="bi bi-x-lg cancel-icon"></i> {text}
        </button>
    );
}
