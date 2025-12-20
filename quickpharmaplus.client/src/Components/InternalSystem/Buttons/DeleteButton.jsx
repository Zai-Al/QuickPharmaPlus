import "./Buttons.css";


export default function DeleteButton({ onClick }) {
    return (
        <button
            className="delete-btn btn-sm w-100"
            onClick={onClick}
        >
            <i className="bi bi-trash me-1"></i>
            Delete
        </button>
    );
}
