import CancelButton from "./Buttons/CancelButton";
import "./FormHeader.css";

export default function FormHeader({ title, to }) {
    return (
        <div className="form-section-header">
            <h2>{title}</h2>

            <div className="header-cancel-btn">
                <CancelButton to={to} text="Cancel" />
            </div>
        </div>
    );
}
