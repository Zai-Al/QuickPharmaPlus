import "./GeneralComponents.css";
export default function InputTextField({
    value,
    onChange,
    placeholder,
    onBlur,
    className = "",
    ...rest
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={`filter-text-input form-control ${className}`}
            {...rest}
        />
    );
}
