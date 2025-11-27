import "./GeneralComponents.css";

export default function FilterTextField({ placeholder, value, onChange }) {
    return (
        <input
            type="text"
            className="form-control filter-text-input"
            placeholder={placeholder}
            value={value}
            onChange={onChange}
        />
    );
}
