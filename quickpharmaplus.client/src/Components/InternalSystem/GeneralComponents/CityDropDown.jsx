// CityDropDown.jsx
import "./CityDropDown.css";

export default function CityDropDown({ placeholder, options = [], value, onChange }) {
    return (
        <select
            className="city-dropdown"
            value={value}
            onChange={onChange}
        >
            {/* Placeholder */}
            <option value="">{placeholder}</option>

            {/* Dynamic Options */}
            {options.map((opt, index) => (
                <option key={index} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}