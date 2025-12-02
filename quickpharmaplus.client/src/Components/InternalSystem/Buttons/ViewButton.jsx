import { Link } from "react-router-dom";
import "./Buttons.css";

export default function ViewButton({ to, text }) {
    return (
        <Link
            to={to}
            className="view-btn btn-sm w-100"
        >
            {text}
        </Link>
    );
}
