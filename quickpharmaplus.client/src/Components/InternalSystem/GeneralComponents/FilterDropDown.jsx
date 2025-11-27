import "./GeneralComponents.css";

export default function FilterDropdown({ placeholder, options = [], value, onChange }) {
    return (
        <select
            className="form-select filter-dropdown"
            value={value}
            onChange={onChange}
        >
            {/* HEADER / PLACEHOLDER */}
            <option value="">{placeholder}</option>

            {/* OPTIONS PASSED FROM PAGE */}
            {options.map((opt, index) => (
                <option key={index} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}
