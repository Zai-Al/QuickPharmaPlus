import "./Buttons.css";

export default function ClearButton({onClear }) {
    return (
        <button
            type="button"
            className="clear-btn"
            onClick={onClear}
        >
            <i className="bi bi-eraser me-2"></i>
            Clear
        </button>
    );
}
