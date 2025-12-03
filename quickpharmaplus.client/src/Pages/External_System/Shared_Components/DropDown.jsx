// src/Shared_Components/DropDown.jsx
export default function DropDown({
    label,
    name,
    value,
    options = [],
    placeholder = "Select an option",
    onChange,
    className,
    error, 
    disabled = false,
}) {
    return (
        <div className="mb-4">
            {label && (
                <h5 className="fw-bold mb-3 text-start">
                    {label}
                </h5>
            )}

            <select
                className={`form-select ${className || ""} ${error ? "is-invalid" : ""}`}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled }
            >
                <option value="" disabled hidden>{placeholder}</option>

                {options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>

            {error && (
                <div className="invalid-feedback d-block text-start">
                    {error}
                </div>
            )}
        </div>
    );
}
