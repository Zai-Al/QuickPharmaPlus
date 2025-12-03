import React, { forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar3 } from "react-bootstrap-icons"; // Bootstrap icon
import "./GeneralComponents.css";

const CustomInput = forwardRef(({ value, onClick, placeholderText }, ref) => (
    <div className="date-picker-wrapper" onClick={onClick}>
        <input
            value={value}
            readOnly
            ref={ref}
            className="filter-date-picker"
            placeholder={value ? "" : placeholderText} // Show placeholder only when no date is selected
        />
        <Calendar3 className="calendar-icon" />
    </div>
));

export default function CustomDatePicker({ selected, onChange, placeholderText }) {
    return (
        <DatePicker
            selected={selected}
            onChange={onChange}
            dateFormat="dd/MM/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            onKeyDown={(e) => e.preventDefault()}
            customInput={<CustomInput placeholderText={placeholderText} />}
        />
    );
}
