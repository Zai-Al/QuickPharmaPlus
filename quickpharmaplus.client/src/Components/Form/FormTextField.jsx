import "./Form.css";

export default function FormTextField({
    value,
    onChange,
    placeholder,
    onBlur,
    ...rest
}) {
    return (
        <input
            type="text"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            className={"form-text-input form-control mb-3"}
            {...rest}
        />
    );
}