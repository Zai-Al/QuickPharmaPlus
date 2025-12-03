import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar3 } from "react-bootstrap-icons"; // Bootstrap icon
import "./FormDatePicker.css"

const CustomInput = forwardRef(({ value, onClick, placeholderText }, ref) => (
    <div className="form-date-picker-wrapper" onClick={onClick}>
        <input
            value={value}
            readOnly
            ref={ref}
            className="form-date-picker"
            placeholder={value ? "" : placeholderText} // Show placeholder only when no date is selected
        />
        <Calendar3 className="calendar-icon" />
    </div>
));

export default function FormDatePicker({
    selected,
    onChange,
    placeholderText,
}) {
    return (
        <div style={{ width: "100%" }}>   {/* FORCE 80% WIDTH HERE */}
            <DatePicker
                selected={selected}
                onChange={onChange}
                dateFormat="dd/MM/yyyy"
                wrapperClassName="full-width-datepicker" // Apply the class here
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                onKeyDown={(e) => e.preventDefault()}
                customInput={<CustomInput placeholderText={placeholderText} />}
            />
        </div>
    );
}

