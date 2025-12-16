import { useNavigate } from "react-router-dom";
import "./Buttons.css";

export default function EditButton({ to, onClick }) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (to) {
            navigate(to);
        }
    };

    return (
        <button
            type="button"
            className="edit-btn"
            onClick={handleClick}
        >
            <i className="bi bi-pencil-square me-1"></i>
            Edit
        </button>
    );
}