import "./Buttons.css";


export default function DeleteButton({ onClick }) {
    return (
        <button
            className="delete-btn btn-sm w-100"
            onClick={onClick}
        >
            Delete
        </button>
    );
}
