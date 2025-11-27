import { Link } from "react-router-dom";
import "./Buttons.css";

export default function EditButton({ to }) {
    return (
        <Link
            to={to}
            className="edit-btn btn w-100"
        >
            Edit
        </Link>
    );
}
