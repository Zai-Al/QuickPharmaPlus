import "./Buttons.css";

export default function SearchButton({ onClick }) {
    return (
        <button
            className="btn search-btn-custom d-flex align-items-center gap-2"
            onClick={onClick}
        >
            <i className="bi bi-search"></i>
            Search
        </button>
    );
}
