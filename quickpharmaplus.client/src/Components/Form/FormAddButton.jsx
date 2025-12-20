//import the css file
import "./Form.css"

export default function AddButton({ text, icon = "plus-circle" }) {
    return (
        <button
            type="submit"
            className="add-btn-custom d-flex align-items-center gap-4"
        >
            <i className={`bi bi-${icon} fs-5`}></i>
            {text}
        </button>
    );
}
