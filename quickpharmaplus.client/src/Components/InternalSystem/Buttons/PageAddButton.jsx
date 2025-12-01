import { Link } from "react-router-dom";
import "./Buttons.css";

export default function AddButton({ to, text }) {
    return (
        <Link
            to={to}
            className="btn page-add-btn-custom d-flex align-items-center gap-2"
        >
            <i className="bi bi-plus-circle fs-5"></i>
            {text}
        </Link>
    );
}
