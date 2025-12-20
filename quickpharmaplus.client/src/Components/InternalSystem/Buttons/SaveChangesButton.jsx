import { Link } from "react-router-dom";
import "./Buttons.css";

export default function SaveButton() {
    return (
        <Link
            className="btn page-add-btn-custom d-flex align-items-center gap-2"
        >
            <i className="bi bi-save fs-5 me-1" ></i>
            Save Changes
        </Link>
    );
}
