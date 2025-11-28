import "./Buttons.css";


export default function DisposeButton({ onClick }) {
    return (
        <button
            className="delete-btn btn-sm w-100"
            onClick={onClick}
        >
            Dispose
        </button>
    );
}
