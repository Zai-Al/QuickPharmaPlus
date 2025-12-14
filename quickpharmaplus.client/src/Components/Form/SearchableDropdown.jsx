import { useState, useRef, useEffect } from "react";
import "./Form.css";
import "./SearchableDropdown.css";

export default function SearchableDropdown({ placeholder, options = [], value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    // Get the label for the selected value
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : "";

    // Filter options based on search term
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange({ target: { value: optionValue } });
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleToggle = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            setSearchTerm("");
        }
    };

    return (
        <div className="searchable-dropdown" ref={dropdownRef}>
            <div className="searchable-dropdown-input" onClick={handleToggle}>
                <input
                    type="text"
                    className="form-control"
                    placeholder={displayText || placeholder}
                    value={isOpen ? searchTerm : displayText}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                />
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} dropdown-icon`}></i>
            </div>

            {isOpen && (
                <div className="searchable-dropdown-menu">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`searchable-dropdown-item ${opt.value === value ? 'selected' : ''}`}
                                onClick={() => handleSelect(opt.value)}
                            >
                                {opt.label}
                            </div>
                        ))
                    ) : (
                        <div className="searchable-dropdown-item no-results">
                            No products found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}